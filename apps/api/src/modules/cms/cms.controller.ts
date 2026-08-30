import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { CmsPageCode } from '@prisma/client';
import { PermissionCode } from '@kop/shared';
import { CmsService } from './cms.service';
import { UpdateCmsPageDto } from './dto/update-cms-page.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';

@Controller()
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Get('cms/pages/:code')
  getPublicPage(@Param('code') code: CmsPageCode) {
    return this.cmsService.getPublicPage(code);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_CONTENT)
  @Get('admin/cms/pages/:code')
  getAdminPage(@Param('code') code: CmsPageCode) {
    return this.cmsService.getAdminPage(code);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_CONTENT)
  @Put('admin/cms/pages/:code')
  updatePage(
    @Param('code') code: CmsPageCode,
    @Body() dto: UpdateCmsPageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.cmsService.updatePage(code, dto, user.id);
  }
}
