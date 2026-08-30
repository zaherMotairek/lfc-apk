import { Module } from '@nestjs/common';
import { MembersService } from './members.service';
import { MembershipCardsService } from './membership-cards.service';
import { MembersController } from './members.controller';
import { AuditService } from '../../common/services/audit.service';
import { MediaModule } from '../../common/media/media.module';

@Module({
  imports: [MediaModule],
  controllers: [MembersController],
  providers: [MembersService, MembershipCardsService, AuditService],
  exports: [MembersService, MembershipCardsService],
})
export class MembersModule {}
