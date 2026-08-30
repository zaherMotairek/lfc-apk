import { Module } from '@nestjs/common';
import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';
import { AuditService } from '../../common/services/audit.service';

@Module({
  controllers: [CmsController],
  providers: [CmsService, AuditService],
  exports: [CmsService],
})
export class CmsModule {}
