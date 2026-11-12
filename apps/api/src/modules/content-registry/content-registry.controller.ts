import { Body, Controller, Delete, Get, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionCode } from '@kop/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ContentRegistryService } from './content-registry.service';
import { UpdateContentOverrideDto } from './dto/update-content-override.dto';

@Controller()
export class ContentRegistryController {
  constructor(private readonly contentRegistryService: ContentRegistryService) {}

  @Get('content/bundle')
  getBundle(@Query('lang') lang?: string) {
    return this.contentRegistryService.getBundle(lang?.trim() || 'en');
  }

  @Get('admin/content/texts')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_CONTENT)
  list(@Query('lang') lang?: string) {
    return this.contentRegistryService.listAdminWithValues(lang?.trim() || 'en');
  }

  @Put('admin/content/texts')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_CONTENT)
  update(@Body() dto: UpdateContentOverrideDto, @CurrentUser() user: { id: string }) {
    return this.contentRegistryService.upsertOverride({
      key: dto.key,
      language: dto.language ?? 'en',
      value: dto.value,
      actorUserId: user.id,
    });
  }

  @Delete('admin/content/texts')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_CONTENT)
  reset(
    @Query('key') key: string,
    @Query('lang') lang: string | undefined,
    @CurrentUser() user: { id: string },
  ) {
    return this.contentRegistryService.resetOverride(key, lang?.trim() || 'en', user.id);
  }
}
