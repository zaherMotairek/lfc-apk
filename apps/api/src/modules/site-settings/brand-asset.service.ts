import { Injectable, Logger } from '@nestjs/common';
import { MediaStorageService } from '../../common/services/media-storage.service';

type GeneratedIconUrls = {
  iconUrl: string;
  pwa192Url?: string;
  pwa512Url?: string;
  appleTouchUrl?: string;
};

@Injectable()
export class BrandAssetService {
  private readonly logger = new Logger(BrandAssetService.name);

  constructor(private readonly mediaStorage: MediaStorageService) {}

  async generatePwaIconsFromUpload(
    userId: string,
    file: Express.Multer.File,
  ): Promise<GeneratedIconUrls> {
    let sharpFn: ((input: Buffer) => import('sharp').Sharp) | null = null;
    try {
      const mod = await import('sharp');
      sharpFn = mod.default;
    } catch {
      this.logger.warn('sharp not installed — using original upload only');
    }

    if (!sharpFn || !file.buffer?.length) {
      const iconUrl = await this.mediaStorage.uploadBrandAsset(userId, file);
      return { iconUrl };
    }

    const base = sharpFn(file.buffer).rotate().resize(512, 512, { fit: 'cover' });
    const sizes: Array<{ key: keyof GeneratedIconUrls; size: number; name: string }> = [
      { key: 'pwa512Url', size: 512, name: 'pwa-512' },
      { key: 'pwa192Url', size: 192, name: 'pwa-192' },
      { key: 'appleTouchUrl', size: 180, name: 'apple-touch' },
    ];

    const out: GeneratedIconUrls = { iconUrl: '' };

    for (const { key, size, name } of sizes) {
      const buffer = await base.clone().resize(size, size).png().toBuffer();
      const url = await this.mediaStorage.uploadBrandBuffer(userId, buffer, name, 'image/png');
      out[key] = url;
      if (size === 512) {
        out.iconUrl = url;
      }
    }

    if (!out.iconUrl) {
      out.iconUrl = out.pwa512Url ?? (await this.mediaStorage.uploadBrandAsset(userId, file));
    }

    return out;
  }
}
