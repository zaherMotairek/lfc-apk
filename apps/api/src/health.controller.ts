import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './common/services/email.service';
import { MediaStorageService } from './common/services/media-storage.service';
import { isProduction } from './common/utils/environment';

@Controller('health')
export class HealthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly mediaStorageService: MediaStorageService,
  ) {}

  @Get()
  check() {
    const emailConfigured = this.emailService.isConfigured();
    const cloudinaryConfigured = this.mediaStorageService.isCloudinaryConfigured();

    return {
      status: 'ok',
      service: 'kop-api',
      environment: isProduction() ? 'production' : 'development',
      timestamp: new Date().toISOString(),
      integrations: {
        email: emailConfigured ? 'configured' : 'dev-fallback',
        mediaStorage: cloudinaryConfigured ? 'cloudinary' : 'local-disk',
      },
      productionReady: {
        email: emailConfigured || !isProduction(),
        jwtSecrets: !this.usesDefaultJwtSecrets(),
        cloudinary: cloudinaryConfigured || !isProduction(),
      },
    };
  }

  private usesDefaultJwtSecrets(): boolean {
    const access = this.configService.get<string>('JWT_ACCESS_SECRET') ?? '';
    const refresh = this.configService.get<string>('JWT_REFRESH_SECRET') ?? '';
    return access.includes('change-me') || refresh.includes('change-me');
  }
}
