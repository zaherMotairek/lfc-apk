import { Module } from '@nestjs/common';
import { MembersService } from './members.service';
import { MembershipCardsService } from './membership-cards.service';
import { MembershipApplicationsService } from './membership-applications.service';
import { MembersController } from './members.controller';
import { MembershipApplicationsController } from './membership-applications.controller';
import { AuditService } from '../../common/services/audit.service';
import { MediaModule } from '../../common/media/media.module';

@Module({
  imports: [MediaModule],
  controllers: [MembersController, MembershipApplicationsController],
  providers: [
    MembersService,
    MembershipCardsService,
    MembershipApplicationsService,
    AuditService,
  ],
  exports: [MembersService, MembershipCardsService, MembershipApplicationsService],
})
export class MembersModule {}
