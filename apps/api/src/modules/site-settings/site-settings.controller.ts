import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionCode } from '@kop/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MediaStorageService } from '../../common/services/media-storage.service';
import { SiteSettingsService } from './site-settings.service';
import { BrandAssetService } from './brand-asset.service';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';

@Controller()
export class SiteSettingsController {
  constructor(
    private readonly siteSettingsService: SiteSettingsService,
    private readonly mediaStorageService: MediaStorageService,
    private readonly brandAssetService: BrandAssetService,
  ) {}

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

  @Post('admin/site-settings/upload-brand-image')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_SETTINGS)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 4 * 1024 * 1024 },
    }),
  )
  uploadBrandImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('slot') slot: string | undefined,
    @CurrentUser() user: { id: string },
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }
    const slotNorm = (slot ?? '').toLowerCase();
    if (slotNorm === 'icon' || slotNorm === 'brand.iconurl') {
      return this.brandAssetService.generatePwaIconsFromUpload(user.id, file).then((urls) => ({
        url: urls.iconUrl,
        sizes: urls,
        message: 'Brand icon uploaded with PWA sizes.',
      }));
    }

    return this.mediaStorageService
      .uploadBrandAsset(user.id, file)
      .then((url) => ({ url, message: 'Brand image uploaded.' }));
  }
}
