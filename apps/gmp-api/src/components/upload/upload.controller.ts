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
import { memoryStorage } from 'multer';
import { UploadService, ImageType } from './upload.service';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const VALID_IMAGE_TYPES: ImageType[] = ['avatar', 'logo', 'cover', 'image'];

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
          return cb(new BadRequestException('Faqat JPEG, PNG yoki WebP rasm qabul qilinadi'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('type') type: ImageType = 'image',
  ) {
    if (!file) {
      throw new BadRequestException('Fayl topilmadi');
    }

    if (!VALID_IMAGE_TYPES.includes(type)) {
      throw new BadRequestException(`type: ${VALID_IMAGE_TYPES.join(' | ')} bo'lishi kerak`);
    }

    return this.uploadService.uploadImage(file, type);
  }
}
