import { Module } from '@nestjs/common';
import { ContentRegistryController } from './content-registry.controller';
import { ContentRegistryService } from './content-registry.service';
import { AuditService } from '../../common/services/audit.service';

@Module({
  controllers: [ContentRegistryController],
  providers: [ContentRegistryService, AuditService],
  exports: [ContentRegistryService],
})
export class ContentRegistryModule {}
