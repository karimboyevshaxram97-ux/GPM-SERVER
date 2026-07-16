import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import {
  ApplicationDocument,
  ApplicationDocumentRecord,
} from '../../schemas/ApplicationDocument.model';
import { ApplicationDocumentStatus, UserRole } from '../../libs/enums';
import {
  RequestApplicationDocumentInput,
  ReviewApplicationDocumentInput,
} from '../../libs/dto/application-document/application-document.input';
import { ApplicationService } from '../application/application.service';
import { AgencyService } from '../agency/agency.service';

const PRIVATE_DOCUMENT_DIR = path.join(
  process.cwd(),
  'private-uploads',
  'application-documents',
);

const FILE_SIGNATURES = {
  'application/pdf': {
    extension: '.pdf',
    valid: (buffer: Buffer) =>
      buffer.subarray(0, 5).toString('ascii') === '%PDF-',
  },
  'image/jpeg': {
    extension: '.jpg',
    valid: (buffer: Buffer) =>
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff,
  },
  'image/png': {
    extension: '.png',
    valid: (buffer: Buffer) =>
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
} as const;

@Injectable()
export class ApplicationDocumentService {
  constructor(
    @InjectModel(ApplicationDocument.name)
    private readonly documentModel: Model<ApplicationDocumentRecord>,
    private readonly applicationService: ApplicationService,
    private readonly agencyService: AgencyService,
  ) {}

  async list(
    applicationId: string,
    user: any,
  ): Promise<ApplicationDocumentRecord[]> {
    const application = await this.getAuthorizedApplication(
      applicationId,
      user,
    );
    return this.documentModel
      .find({ application: application._id })
      .sort({ createdAt: 1 })
      .exec();
  }

  async request(
    input: RequestApplicationDocumentInput,
    user: any,
  ): Promise<ApplicationDocumentRecord> {
    const application = await this.applicationService.findById(
      input.applicationId,
    );
    if (!application) throw new NotFoundException('Application not found');
    const isApplicationOwner =
      application.user.toString() === user?._id?.toString();
    if (!isApplicationOwner) {
      await this.agencyService.assertAgencyAdmin(
        application.agency.toString(),
        user,
      );
    }

    return this.documentModel.create({
      application: application._id,
      user: application.user,
      agency: application.agency,
      kind: input.kind,
      label: input.label.trim(),
      required: isApplicationOwner ? false : (input.required ?? true),
      status: ApplicationDocumentStatus.REQUESTED,
    });
  }

  async review(
    input: ReviewApplicationDocumentInput,
    user: any,
  ): Promise<ApplicationDocumentRecord> {
    if (
      ![
        ApplicationDocumentStatus.ACCEPTED,
        ApplicationDocumentStatus.REJECTED,
      ].includes(input.status)
    ) {
      throw new BadRequestException(
        'Document status must be ACCEPTED or REJECTED',
      );
    }
    if (
      input.status === ApplicationDocumentStatus.REJECTED &&
      !input.rejectionReason?.trim()
    ) {
      throw new BadRequestException('Rejection reason is required');
    }

    const document = await this.findById(input.documentId);
    await this.agencyService.assertAgencyAdmin(
      document.agency.toString(),
      user,
    );
    if (!document.storedName)
      throw new BadRequestException('Document has not been uploaded');

    document.status = input.status;
    document.rejectionReason =
      input.status === ApplicationDocumentStatus.REJECTED
        ? input.rejectionReason?.trim()
        : undefined;
    document.reviewedAt = new Date();
    return document.save();
  }

  async upload(
    documentId: string,
    file: Express.Multer.File,
    user: any,
  ): Promise<ApplicationDocumentRecord> {
    const document = await this.findById(documentId);
    if (document.user.toString() !== user?._id?.toString()) {
      throw new ForbiddenException(
        'Only the application owner can upload this document',
      );
    }
    if (document.status === ApplicationDocumentStatus.ACCEPTED) {
      throw new BadRequestException('Accepted documents cannot be replaced');
    }

    const detected = Object.entries(FILE_SIGNATURES).find(([, signature]) =>
      signature.valid(file.buffer),
    );
    if (!detected) {
      throw new BadRequestException(
        'File content does not match an allowed PDF, JPEG, or PNG format',
      );
    }
    const [detectedMimeType, signature] = detected;

    fs.mkdirSync(PRIVATE_DOCUMENT_DIR, { recursive: true });
    const storedName = `${uuid()}${signature.extension}`;
    const target = this.resolveStoredPath(storedName);
    await fs.promises.writeFile(target, file.buffer, {
      flag: 'wx',
      mode: 0o600,
    });

    if (document.storedName) {
      await fs.promises.rm(this.resolveStoredPath(document.storedName), {
        force: true,
      });
    }

    document.originalName = path.basename(file.originalname).slice(0, 180);
    document.storedName = storedName;
    document.mimeType = detectedMimeType;
    document.size = file.size;
    document.status = ApplicationDocumentStatus.UPLOADED;
    document.rejectionReason = undefined;
    document.reviewedAt = undefined;
    document.uploadedAt = new Date();
    return document.save();
  }

  async getDownload(
    documentId: string,
    user: any,
  ): Promise<{ document: ApplicationDocumentRecord; filepath: string }> {
    const document = await this.findById(documentId);
    await this.getAuthorizedApplication(document.application.toString(), user);
    if (!document.storedName)
      throw new NotFoundException('Document file not found');
    const filepath = this.resolveStoredPath(document.storedName);
    if (!fs.existsSync(filepath))
      throw new NotFoundException('Document file not found');
    return { document, filepath };
  }

  private async findById(id: string): Promise<ApplicationDocumentRecord> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid document id');
    const document = await this.documentModel.findById(id).exec();
    if (!document)
      throw new NotFoundException('Application document not found');
    return document;
  }

  private async getAuthorizedApplication(applicationId: string, user: any) {
    if (!Types.ObjectId.isValid(applicationId))
      throw new BadRequestException('Invalid application id');
    const application = await this.applicationService.findById(applicationId);
    if (!application) throw new NotFoundException('Application not found');

    const userId = user?._id?.toString();
    if (
      application.user.toString() === userId ||
      user?.role === UserRole.SUPER_ADMIN
    ) {
      return application;
    }
    await this.agencyService.assertAgencyAdmin(
      application.agency.toString(),
      user,
    );
    return application;
  }

  private resolveStoredPath(storedName: string): string {
    const filepath = path.resolve(
      PRIVATE_DOCUMENT_DIR,
      path.basename(storedName),
    );
    if (
      !filepath.startsWith(`${path.resolve(PRIVATE_DOCUMENT_DIR)}${path.sep}`)
    ) {
      throw new BadRequestException('Invalid document path');
    }
    return filepath;
  }
}
