import { Injectable, BadRequestException } from '@nestjs/common';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuid } from 'uuid';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

const IMAGE_SIZES = {
  avatar: { width: 300, height: 300 },
  logo:   { width: 400, height: 400 },
  cover:  { width: 1200, height: 400 },
  image:  { width: 800, height: 600 },
} as const;

export type ImageType = keyof typeof IMAGE_SIZES;

export interface UploadResult {
  url: string;
  filename: string;
}

@Injectable()
export class UploadService {
  async uploadImage(file: Express.Multer.File, type: ImageType): Promise<UploadResult> {
    this.ensureUploadsDir();

    const { width, height } = IMAGE_SIZES[type];
    const filename = `${type}_${uuid()}.webp`;
    const filepath = path.join(UPLOADS_DIR, filename);

    await sharp(file.buffer)
      .resize(width, height, { fit: 'cover', position: 'centre' })
      .webp({ quality: 85 })
      .toFile(filepath);

    return {
      url: `/uploads/${filename}`,
      filename,
    };
  }

  deleteImage(filename: string): void {
    const filepath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }

  private ensureUploadsDir(): void {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  }
}
