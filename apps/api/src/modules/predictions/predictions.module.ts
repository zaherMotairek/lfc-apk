import { Module } from '@nestjs/common';
import { PredictionsController } from './predictions.controller';
import { PredictionsService } from './predictions.service';
import { AuditService } from '../../common/services/audit.service';
import { SiteSettingsModule } from '../site-settings/site-settings.module';

@Module({
  imports: [SiteSettingsModule],
  controllers: [PredictionsController],
  providers: [PredictionsService, AuditService],
  exports: [PredictionsService],
})
export class PredictionsModule {}
