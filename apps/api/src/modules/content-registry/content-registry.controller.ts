import { Body, Controller, Delete, Get, Post, Put, Query, UseGuards } from '@nestjs/common';
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

  @Get('admin/content/texts/revisions')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_CONTENT)
  listRevisions(@Query('key') key: string, @Query('lang') lang?: string) {
    return this.contentRegistryService.listRevisions(key, lang?.trim() || 'en');
  }

  @Post('admin/content/texts/rollback')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_CONTENT)
  rollback(
    @Body() body: { key: string; language?: string },
    @CurrentUser() user: { id: string },
  ) {
    return this.contentRegistryService.rollbackToPrevious(
      body.key,
      body.language ?? 'en',
      user.id,
    );
  }

  @Post('admin/content/texts/panic-restore')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_CONTENT)
  panicRestore(
    @Body() body: { language?: string; confirmPhrase: string },
    @CurrentUser() user: { id: string },
  ) {
    return this.contentRegistryService.panicRestoreDefaults({
      language: body.language ?? 'en',
      confirmPhrase: body.confirmPhrase ?? '',
      actorUserId: user.id,
    });
  }

  @Post('admin/content/texts/import-lang-defaults')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_CONTENT)
  importLangDefaults(
    @Body() body: { language?: string },
    @CurrentUser() user: { id: string },
  ) {
    return this.contentRegistryService.importLanguageDefaults(body.language ?? 'ar', user.id);
  }
}
