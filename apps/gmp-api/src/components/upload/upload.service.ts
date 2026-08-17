import { Injectable, BadRequestException } from '@nestjs/common';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuid } from 'uuid';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

const IMAGE_SIZES = {
  avatar: { width: 300, height: 300, fit: 'cover' as const },
  logo: { width: 400, height: 400, fit: 'cover' as const },
  cover: { width: 1200, height: 400, fit: 'cover' as const },
  image: { width: 800, height: 600, fit: 'cover' as const },
  // Izoh rasmlari: board-foto kabi markazdan kesilmasin — faqat maksimal
  // o'lchamga (kesmasdan) sig'diriladi.
  comment: { width: 1200, height: 1200, fit: 'inside' as const },
} as const;

export type ImageType = keyof typeof IMAGE_SIZES;

export interface UploadResult {
  url: string;
  filename: string;
}

@Injectable()
export class UploadService {
  // subDir berilsa fayl uploads/<subDir>/ ichiga saqlanadi (masalan photos/study-abroad)
  async uploadImage(
    file: Express.Multer.File,
    type: ImageType,
    subDir?: string,
  ): Promise<UploadResult> {
    const targetDir = subDir ? path.join(UPLOADS_DIR, subDir) : UPLOADS_DIR;
    fs.mkdirSync(targetDir, { recursive: true });

    const { width, height, fit } = IMAGE_SIZES[type];
    const filename = `${type}_${uuid()}.webp`;
    const filepath = path.join(targetDir, filename);

    await sharp(file.buffer)
      .resize(width, height, {
        fit,
        position: 'centre',
        // Manba rasm target o'lchamdan kichik bo'lsa kattalashtirilmaydi —
        // aks holda kichik rasm cho'zilib xira chiqadi va bu abadiy faylga yoziladi.
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toFile(filepath);

    // DB va URL uchun nisbiy yo'l (photos/study-abroad/image_x.webp)
    const relative = subDir
      ? `${subDir.replace(/\\/g, '/')}/${filename}`
      : filename;

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
