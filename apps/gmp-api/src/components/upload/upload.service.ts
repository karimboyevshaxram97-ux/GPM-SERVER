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
  // subDir berilsa fayl uploads/<subDir>/ ichiga saqlanadi (masalan photos/study-abroad)
  async uploadImage(file: Express.Multer.File, type: ImageType, subDir?: string): Promise<UploadResult> {
    const targetDir = subDir ? path.join(UPLOADS_DIR, subDir) : UPLOADS_DIR;
    fs.mkdirSync(targetDir, { recursive: true });

    const { width, height } = IMAGE_SIZES[type];
    const filename = `${type}_${uuid()}.webp`;
    const filepath = path.join(targetDir, filename);

    await sharp(file.buffer)
      .resize(width, height, { fit: 'cover', position: 'centre' })
      .webp({ quality: 85 })
      .toFile(filepath);

    // DB va URL uchun nisbiy yo'l (photos/study-abroad/image_x.webp)
    const relative = subDir ? `${subDir.replace(/\\/g, '/')}/${filename}` : filename;

    return {
      url: `/uploads/${relative}`,
      filename: relative,
    };
  }

  deleteImage(filename: string): void {
    const filepath = path.resolve(UPLOADS_DIR, filename);
    // uploads papkasidan tashqariga chiqishni bloklaymiz
    if (!filepath.startsWith(UPLOADS_DIR)) {
      throw new BadRequestException('Invalid file path');
    }
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }
}
