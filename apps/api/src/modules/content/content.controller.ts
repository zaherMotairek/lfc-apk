import {
  BadRequestException,
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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PermissionCode } from '@kop/shared';
import { ContentService } from './content.service';
import { MediaStorageService } from '../../common/services/media-storage.service';
import {
  CreateEventDto,
  CreateMediaAlbumDto,
  CreateMediaAssetDto,
  CreateNewsDto,
  UpdateEventDto,
  UpdateNewsDto,
} from './dto/content.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';

@Controller()
export class ContentController {
  constructor(
    private readonly contentService: ContentService,
    private readonly mediaStorageService: MediaStorageService,
  ) {}

  @Get('news')
  listPublishedNews() {
    return this.contentService.listPublishedNews();
  }

  @Get('news/:slug')
  getPublishedNews(@Param('slug') slug: string) {
    return this.contentService.getPublishedNewsBySlug(slug);
  }

  @Get('events')
  listPublicEvents() {
    return this.contentService.listPublicEvents();
  }

  @Get('events/:id')
  getPublicEvent(@Param('id') id: string) {
    return this.contentService.getPublicEvent(id);
  }

  @Get('gallery')
  listPublicAlbums() {
    return this.contentService.listPublicAlbums();
  }

  @Get('gallery/:id')
  getPublicAlbum(@Param('id') id: string) {
    return this.contentService.getPublicAlbum(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_NEWS)
  @Get('admin/news')
  listAdminNews() {
    return this.contentService.listAdminNews();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_NEWS)
  @Post('admin/news')
  createNews(
    @Body() dto: CreateNewsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.contentService.createNews(dto, user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_NEWS)
  @Put('admin/news/:id')
  updateNews(
    @Param('id') id: string,
    @Body() dto: UpdateNewsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.contentService.updateNews(id, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_NEWS)
  @Delete('admin/news/:id')
  deleteNews(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.contentService.deleteNews(id, user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_EVENTS)
  @Get('admin/events')
  listAdminEvents() {
    return this.contentService.listAdminEvents();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_EVENTS)
  @Get('admin/events/:id/registrations')
  listAdminEventRegistrations(@Param('id') eventId: string) {
    return this.contentService.listEventRegistrations(eventId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_EVENTS)
  @Post('admin/events')
  createEvent(
    @Body() dto: CreateEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.contentService.createEvent(dto, user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_EVENTS)
  @Put('admin/events/:id')
  updateEvent(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.contentService.updateEvent(id, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_EVENTS)
  @Delete('admin/events/:id')
  deleteEvent(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.contentService.deleteEvent(id, user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_CONTENT)
  @Post('admin/newsletter/upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  uploadNewsletterImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }
    return this.mediaStorageService
      .uploadNewsletterImage(user.id, file)
      .then((url) => ({ url, message: 'Image uploaded successfully.' }));
  }

  @Get('newsletters')
  listPublishedNewsletters() {
    return this.contentService.listPublishedNewsletters();
  }

  @Get('newsletters/:slug')
  getPublishedNewsletter(@Param('slug') slug: string) {
    return this.contentService.getPublishedNewsletter(slug);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_CONTENT)
  @Get('admin/newsletters')
  listAdminNewsletters() {
    return this.contentService.listAdminNewsletters();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_CONTENT)
  @Post('admin/newsletters')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  async publishNewsletter(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      title?: string;
      issueNumber?: string;
      monthLabel?: string;
      excerpt?: string;
    },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) {
      throw new BadRequestException('PDF file is required');
    }
    const isPdf =
      file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      throw new BadRequestException('Only PDF files are allowed');
    }
    const pdfUrl = await this.mediaStorageService.uploadNewsletterPdf(user.id, file);
    return this.contentService.createNewsletterIssue(
      {
        title: body.title ?? '',
        issueNumber: Number(body.issueNumber),
        monthLabel: body.monthLabel ?? '',
        excerpt: body.excerpt,
        pdfUrl,
      },
      user.id,
    );
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_CONTENT)
  @Delete('admin/newsletters/:id')
  deleteNewsletter(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.contentService.deleteNewsletterIssue(id, user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_CONTENT)
  @Post('admin/gallery/albums')
  createAlbum(
    @Body() dto: CreateMediaAlbumDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.contentService.createAlbum(dto, user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_CONTENT)
  @Post('admin/gallery/assets')
  addMediaAsset(
    @Body() dto: CreateMediaAssetDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.contentService.addMediaAsset(dto, user.id);
  }
}
