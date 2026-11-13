import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { NewsletterSchedulerService } from './newsletter-scheduler.service';
import { AuditService } from '../../common/services/audit.service';
import { MediaModule } from '../../common/media/media.module';

@Module({
  imports: [MediaModule],
  controllers: [ContentController],
  providers: [ContentService, NewsletterSchedulerService, AuditService],
  exports: [ContentService],
})
export class ContentModule {}
