import { Module } from '@nestjs/common';
import { SiteSettingsController } from './site-settings.controller';
import { SiteSettingsService } from './site-settings.service';
import { BrandAssetService } from './brand-asset.service';
import { AuditService } from '../../common/services/audit.service';
import { MediaModule } from '../../common/media/media.module';

@Module({
  imports: [MediaModule],
  controllers: [SiteSettingsController],
  providers: [SiteSettingsService, BrandAssetService, AuditService],
  exports: [SiteSettingsService],
})
export class SiteSettingsModule {}
