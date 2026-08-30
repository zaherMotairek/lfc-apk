import { Module } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { AuditService } from '../../common/services/audit.service';

@Module({
  controllers: [CommunityController],
  providers: [CommunityService, AuditService],
})
export class CommunityModule {}
