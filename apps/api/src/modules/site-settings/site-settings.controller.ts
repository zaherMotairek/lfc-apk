import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionCode } from '@kop/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SiteSettingsService } from './site-settings.service';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';

@Controller()
export class SiteSettingsController {
  constructor(private readonly siteSettingsService: SiteSettingsService) {}

  @Get('site-settings/public')
  getPublic() {
    return this.siteSettingsService.getPublicSettings();
  }

  @Get('admin/site-settings')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_SETTINGS)
  list() {
    return this.siteSettingsService.listAll();
  }

  @Put('admin/site-settings')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_SETTINGS)
  update(@Body() dto: UpdateSiteSettingsDto, @CurrentUser() user: { id: string }) {
    return this.siteSettingsService.updateSettings(dto, user.id);
  }
}
