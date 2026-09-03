import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PermissionCode } from '@kop/shared';
import { MembershipApplicationStatus } from '@prisma/client';
import { MembershipApplicationsService } from './membership-applications.service';
import { SubmitMembershipApplicationDto } from './dto/submit-membership-application.dto';
import { UpdateMembershipApplicationDto } from './dto/update-membership-application.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';

@Controller()
export class MembershipApplicationsController {
  constructor(private readonly applicationsService: MembershipApplicationsService) {}

  @Post('membership-applications')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  submitApplication(@Body() dto: SubmitMembershipApplicationDto) {
    return this.applicationsService.submitApplication(dto);
  }

  @Get('admin/membership-applications')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_MEMBERSHIPS)
  listApplications(
    @Query('seasonLabel') seasonLabel?: string,
    @Query('status') status?: MembershipApplicationStatus,
  ) {
    return this.applicationsService.listApplications(seasonLabel, status);
  }

  @Put('admin/membership-applications/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_MEMBERSHIPS)
  updateApplication(
    @Param('id') id: string,
    @Body() dto: UpdateMembershipApplicationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.applicationsService.updateApplication(id, dto, user.id);
  }

  @Delete('admin/membership-applications/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_MEMBERSHIPS)
  deleteApplication(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.applicationsService.deleteApplication(id, user.id);
  }

  @Get('admin/membership-applications/export/roster.csv')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_MEMBERSHIPS)
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportRosterCsv(
    @Query('seasonLabel') seasonLabel?: string,
    @Query('status') status?: MembershipApplicationStatus,
  ) {
    const result = await this.applicationsService.exportRosterCsv(
      seasonLabel ?? '2026/27',
      status,
    );
    return {
      filename: result.filename,
      content: result.content,
      count: result.count,
    };
  }

  @Get('admin/membership-applications/export/full.csv')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_MEMBERSHIPS)
  async exportFullCsv(
    @Query('seasonLabel') seasonLabel?: string,
    @Query('status') status?: MembershipApplicationStatus,
  ) {
    return this.applicationsService.exportFullCsv(seasonLabel ?? '2026/27', status);
  }
}
