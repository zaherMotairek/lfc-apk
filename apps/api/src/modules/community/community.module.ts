import { Module } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { AdminCommunityController } from './admin-community.controller';
import { CommunityService } from './community.service';
import { AuditService } from '../../common/services/audit.service';
import { PushDispatchService } from '../../common/services/push-dispatch.service';
import { SiteSettingsModule } from '../site-settings/site-settings.module';
import { MembersModule } from '../members/members.module';

@Module({
  imports: [SiteSettingsModule, MembersModule],
  controllers: [CommunityController, AdminCommunityController],
  providers: [CommunityService, AuditService, PushDispatchService],
})
export class CommunityModule {}
