import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PermissionCode } from '@kop/shared';
import { MembersService } from './members.service';
import { MembershipCardsService } from './membership-cards.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { ImportMembersDto } from './dto/import-members.dto';
import { VerifyCardDto } from './dto/verify-card.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { UpdateMembershipStatusDto } from './dto/update-membership-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MembersController {
  constructor(
    private readonly membersService: MembersService,
    private readonly membershipCardsService: MembershipCardsService,
  ) {}

  @Get('admin/members')
  @Permissions(PermissionCode.MANAGE_MEMBERSHIPS)
  listMembers() {
    return this.membersService.listMembers();
  }

  @Get('admin/members/roster/summary')
  @Permissions(PermissionCode.MANAGE_MEMBERSHIPS)
  getRosterSummary() {
    return this.membersService.getRosterSummary();
  }

  @Post('admin/members/roster/upload')
  @Permissions(PermissionCode.MANAGE_MEMBERSHIPS)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadRoster(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('CSV/Excel export file is required');
    }

    const content = file.buffer.toString('utf8');
    return this.membersService.importOfficialRoster(content, user.id);
  }

  @Post('admin/members')
  @Permissions(PermissionCode.MANAGE_MEMBERSHIPS)
  createMember(
    @Body() dto: CreateMemberDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.membersService.createMember(dto, user.id);
  }

  @Put('admin/members/:id')
  @Permissions(PermissionCode.MANAGE_MEMBERSHIPS)
  updateMember(
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.membersService.updateMember(id, dto, user.id);
  }

  @Delete('admin/members/:id')
  @Permissions(PermissionCode.MANAGE_MEMBERSHIPS)
  deleteUser(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.membersService.deleteUser(id, user.id);
  }

  @Delete('admin/members/:id')
  @Permissions(PermissionCode.MANAGE_MEMBERSHIPS)
  importMembers(
    @Body() dto: ImportMembersDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.membersService.importMembers(dto, user.id);
  }

  @Post('admin/members/:id/invite')
  @Permissions(PermissionCode.MANAGE_MEMBERSHIPS)
  inviteMember(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.membersService.inviteMember(id, user.id);
  }

  @Put('admin/memberships/:id/status')
  @Permissions(PermissionCode.MANAGE_MEMBERSHIPS)
  updateMembershipStatus(
    @Param('id') id: string,
    @Body() dto: UpdateMembershipStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.membersService.updateMembershipStatus(id, dto, user.id);
  }

  @Get('memberships/me/card')
  getMyCard(@CurrentUser() user: AuthenticatedUser) {
    return this.membershipCardsService.getMyActiveCard(user.id);
  }

  @Post('memberships/me/card/image')
  @UseInterceptors(
    FileInterceptor('cardImage', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadMyCardImage(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.membershipCardsService.uploadPhysicalCard(user.id, file);
  }

  @Post('membership-cards/verify')
  @Permissions(PermissionCode.VERIFY_MEMBERSHIP_CARDS)
  verifyCard(
    @Body() dto: VerifyCardDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.membershipCardsService.verifyCard(dto.token, user.id, dto.eventId);
  }
}
