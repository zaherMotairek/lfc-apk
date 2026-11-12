import { Injectable } from '@nestjs/common';
import { SiteSettingsService } from '../site-settings/site-settings.service';

export type BrandPayload = {
  siteName: string;
  shortName: string;
  tagline: string;
  themeColor: string;
  brandRed: string;
  logoUrlLight: string | null;
  logoUrlDark: string | null;
  iconUrl: string | null;
  version: string;
};

@Injectable()
export class BrandService {
  constructor(private readonly siteSettings: SiteSettingsService) {}

  async getPublicBrand(): Promise<BrandPayload> {
    const settings = await this.siteSettings.getPublicSettings();
    return {
      siteName: settings['brand.siteName'] ?? 'RedLeb Hub',
      shortName: settings['brand.shortName'] ?? 'RedLeb',
      tagline: settings['brand.tagline'] ?? 'OLSC Lebanon',
      themeColor: settings['brand.themeColor'] ?? '#c8102e',
      brandRed: settings['brand.red'] ?? '#c8102e',
      logoUrlLight: settings['brand.logoUrlLight'] || null,
      logoUrlDark: settings['brand.logoUrlDark'] || null,
      iconUrl: settings['brand.iconUrl'] || null,
      version: settings['brand.version'] ?? '1',
    };
  }
}
