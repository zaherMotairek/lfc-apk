import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PermissionCode } from '@kop/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuditListService } from './audit-list.service';

@Controller()
export class AuditController {
  constructor(private readonly auditListService: AuditListService) {}

  @Get('admin/audit-logs')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_SETTINGS)
  list(
    @Query('limit') limit?: string,
    @Query('action') action?: string,
    @Query('actorUserId') actorUserId?: string,
  ) {
    return this.auditListService.list({
      limit: limit ? Number(limit) : undefined,
      action: action?.trim() || undefined,
      actorUserId: actorUserId?.trim() || undefined,
    });
  }
}
