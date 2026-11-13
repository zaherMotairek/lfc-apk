import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  constructor(
    private readonly siteSettings: SiteSettingsService,
    private readonly configService: ConfigService,
  ) {}

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

  async buildWebManifest() {
    const brand = await this.getPublicBrand();
    const webPublicUrl = (
      this.configService.get<string>('WEB_PUBLIC_URL') ??
      this.configService.get<string>('APP_URL') ??
      'http://localhost:5173'
    ).replace(/\/$/, '');
    const icons = brand.iconUrl
      ? [
          {
            src: brand.iconUrl,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ]
      : [
          {
            src: `${webPublicUrl}/pwa-192.svg`,
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: `${webPublicUrl}/pwa-512.svg`,
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ];

    return {
      name: brand.siteName,
      short_name: brand.shortName,
      description: `${brand.tagline} — predictions, events, membership.`,
      theme_color: brand.themeColor,
      background_color: '#f5f1ea',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      scope: '/',
      icons,
    };
  }
}
