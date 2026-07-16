import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { createReadStream } from 'fs';
import type { Response } from 'express';
import { ApplicationDocumentService } from './application-document.service';

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

@Controller('application-documents')
export class ApplicationDocumentController {
  constructor(private readonly documentService: ApplicationDocumentService) {}

  @Post(':id/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_DOCUMENT_SIZE, files: 1 },
    }),
  )
  async upload(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() request: any,
  ) {
    if (!file) throw new BadRequestException('Document file is required');
    return this.documentService.upload(id, file, request.user);
  }

  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @Req() request: any,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { document, filepath } = await this.documentService.getDownload(
      id,
      request.user,
    );
    const safeName = (document.originalName || 'document').replace(
      /[\r\n"]/g,
      '_',
    );
    const fallbackExtension =
      document.mimeType === 'application/pdf'
        ? '.pdf'
        : document.mimeType === 'image/png'
          ? '.png'
          : '.jpg';
    response.setHeader(
      'Content-Type',
      document.mimeType || 'application/octet-stream',
    );
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="document${fallbackExtension}"; filename*=UTF-8''${encodeURIComponent(safeName)}`,
    );
    response.setHeader('Cache-Control', 'private, no-store, max-age=0');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    return new StreamableFile(createReadStream(filepath));
  }
}
