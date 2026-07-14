import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Query,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage, diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuid } from 'uuid';
import { UploadService, ImageType } from './upload.service';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const VALID_IMAGE_TYPES: ImageType[] = [
  'avatar',
  'logo',
  'cover',
  'image',
  'comment',
];

// Video — sharp orqali qayta ishlanmaydi, xom holicha diskka yoziladi (diskStorage —
// katta faylni butunlay RAM'da ushlab turmaslik uchun; rasm yo'lidagi memoryStorage
// faqat sharp(file.buffer) uchun kerak, bu yerda bunday iste'molchi yo'q).
const ALLOWED_VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB
const VIDEO_EXTENSION_BY_MIME: Record<string, string> = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
};
const VIDEO_SUBDIR = 'photo-comments';
const VIDEO_UPLOAD_DIR = path.join(process.cwd(), 'uploads', VIDEO_SUBDIR);

// Har bir board o'z papkasiga: uploads/photos/<slug>/
const BOARD_FOLDERS: Record<string, string> = {
  STUDY_ABROAD: 'photos/study-abroad',
  WORK_ABROAD: 'photos/work-abroad',
  TRAVEL: 'photos/travel',
  VISA_SERVICES: 'photos/visa-services',
};

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          return cb(
            new BadRequestException(
              'Faqat JPEG, PNG yoki WebP rasm qabul qilinadi',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('type') type: ImageType = 'image',
    @Query('board') board?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Fayl topilmadi');
    }

    if (!VALID_IMAGE_TYPES.includes(type)) {
      throw new BadRequestException(
        `type: ${VALID_IMAGE_TYPES.join(' | ')} bo'lishi kerak`,
      );
    }

    let subDir: string | undefined;
    if (board) {
      subDir = BOARD_FOLDERS[board];
      if (!subDir) {
        throw new BadRequestException(
          `board: ${Object.keys(BOARD_FOLDERS).join(' | ')} bo'lishi kerak`,
        );
      }
    }

    return this.uploadService.uploadImage(file, type, subDir);
  }

  @Post('video')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          fs.mkdirSync(VIDEO_UPLOAD_DIR, { recursive: true });
          cb(null, VIDEO_UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const ext =
            VIDEO_EXTENSION_BY_MIME[file.mimetype] ||
            path.extname(file.originalname) ||
            '.mp4';
          cb(null, `video_${uuid()}${ext}`);
        },
      }),
      limits: { fileSize: MAX_VIDEO_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_VIDEO_MIME_TYPES.includes(file.mimetype)) {
          return cb(
            new BadRequestException(
              'Faqat MP4, WebM yoki MOV video qabul qilinadi',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  uploadVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Fayl topilmadi');
    }

    return {
      url: `/uploads/${VIDEO_SUBDIR}/${file.filename}`,
      filename: `${VIDEO_SUBDIR}/${file.filename}`,
    };
  }
}
