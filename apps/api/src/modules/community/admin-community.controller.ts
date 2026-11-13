import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { PermissionCode } from '@kop/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CommunityService } from './community.service';
import { AdminPushBroadcastDto } from './dto/community.dto';

@Controller()
export class AdminCommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('admin/comments/recent')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_NEWS)
  listComments(@Query('limit') limit?: string) {
    const parsed = Number(limit ?? 80);
    return this.communityService.listRecentCommentsForAdmin(
      Number.isFinite(parsed) ? parsed : 80,
    );
  }

  @Post('admin/comments/:id/hide')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_NEWS)
  hideComment(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.communityService.hideComment(id, user.id);
  }

  @Delete('admin/comments/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_NEWS)
  deleteComment(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.communityService.deleteComment(id, user.id);
  }

  @Post('admin/events/:eventId/check-in')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_EVENTS)
  checkIn(
    @Param('eventId') eventId: string,
    @Body() body: { token: string },
    @CurrentUser() user: { id: string },
  ) {
    return this.communityService.staffEventCheckIn(eventId, body.token ?? '', user.id);
  }

  @Post('admin/push/broadcast')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_CONTENT)
  broadcastPush(@Body() dto: AdminPushBroadcastDto, @CurrentUser() user: { id: string }) {
    return this.communityService.adminBroadcastPush(user.id, dto);
  }
}
