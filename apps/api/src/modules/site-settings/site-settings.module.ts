import { Module } from '@nestjs/common';
import { SiteSettingsController } from './site-settings.controller';
import { SiteSettingsService } from './site-settings.service';
import { AuditService } from '../../common/services/audit.service';

@Module({
  controllers: [SiteSettingsController],
  providers: [SiteSettingsService, AuditService],
  exports: [SiteSettingsService],
})
export class SiteSettingsModule {}
