import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MediaType, NewsStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import {
  isEventPast,
  isRegistrationOpen,
} from '../../common/utils/event.utils';
import {
  validateEventEnd,
  validateEventStart,
} from '../../common/utils/schedule-dates';
import {
  CreateEventDto,
  CreateMediaAlbumDto,
  CreateMediaAssetDto,
  CreateNewsDto,
  UpdateEventDto,
  UpdateNewsDto,
} from './dto/content.dto';

@Injectable()
export class ContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  listPublishedNews() {
    return this.prisma.newsArticle.findMany({
      where: { status: NewsStatus.PUBLISHED },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImageUrl: true,
        publishedAt: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async getPublishedNewsBySlug(slug: string) {
    const article = await this.prisma.newsArticle.findFirst({
      where: {
        slug,
        status: NewsStatus.PUBLISHED,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return article;
  }

  listAdminNews() {
    return this.prisma.newsArticle.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async createNews(dto: CreateNewsDto, authorId: string) {
    const existing = await this.prisma.newsArticle.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new BadRequestException('Slug already exists');
    }

    const status = dto.status ?? NewsStatus.DRAFT;
    const article = await this.prisma.newsArticle.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        excerpt: dto.excerpt,
        content: dto.content,
        coverImageUrl: dto.coverImageUrl,
        status,
        publishedAt:
          status === NewsStatus.PUBLISHED
            ? dto.publishedAt ?? new Date()
            : dto.publishedAt,
        authorId,
      },
    });

    await this.auditService.log({
      actorUserId: authorId,
      action: 'CREATE_NEWS',
      entityType: 'NEWS_ARTICLE',
      entityId: article.id,
    });

    return {
      message: 'Article created successfully.',
      articleId: article.id,
    };
  }

  async updateNews(id: string, dto: UpdateNewsDto, actorUserId: string) {
    const existing = await this.prisma.newsArticle.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Article not found');
    }

    const status = dto.status ?? existing.status;
    const article = await this.prisma.newsArticle.update({
      where: { id },
      data: {
        title: dto.title,
        slug: dto.slug,
        excerpt: dto.excerpt,
        content: dto.content,
        coverImageUrl: dto.coverImageUrl,
        status,
        publishedAt:
          status === NewsStatus.PUBLISHED
            ? dto.publishedAt ?? existing.publishedAt ?? new Date()
            : dto.publishedAt,
      },
    });

    await this.auditService.log({
      actorUserId,
      action: 'UPDATE_NEWS',
      entityType: 'NEWS_ARTICLE',
      entityId: article.id,
    });

    return {
      message: 'Article updated successfully.',
      article,
    };
  }

  async deleteNews(id: string, actorUserId: string) {
    await this.prisma.newsArticle.delete({ where: { id } });
    await this.auditService.log({
      actorUserId,
      action: 'DELETE_NEWS',
      entityType: 'NEWS_ARTICLE',
      entityId: id,
    });
    return { message: 'Article deleted successfully.' };
  }

  async listPublicEvents() {
    const now = new Date();
    const events = await this.prisma.event.findMany({
      orderBy: { startDateTime: 'asc' },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    });

    const mapped = events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      startDateTime: event.startDateTime,
      endDateTime: event.endDateTime,
      coverImageUrl: event.coverImageUrl,
      capacity: event.capacity,
      registrationOpen: isRegistrationOpen(event, now),
      isPast: isEventPast(event, now),
      registeredCount: event._count.registrations,
    }));

    const upcoming = mapped.filter((event) => !event.isPast);
    const past = mapped
      .filter((event) => event.isPast)
      .sort((a, b) => +new Date(b.startDateTime) - +new Date(a.startDateTime));

    return [...upcoming, ...past];
  }

  private formatIcsUtc(date: Date) {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  }

  private escapeIcsText(value: string) {
    return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/\n/g, '\\n').replace(/,/g, '\\,');
  }

  async buildEventIcs(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const end = event.endDateTime ?? new Date(event.startDateTime.getTime() + 2 * 60 * 60 * 1000);
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//OLSC Lebanon//RedLeb Hub//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${event.id}@redleb-hub`,
      `DTSTAMP:${this.formatIcsUtc(new Date())}`,
      `DTSTART:${this.formatIcsUtc(event.startDateTime)}`,
      `DTEND:${this.formatIcsUtc(end)}`,
      `SUMMARY:${this.escapeIcsText(event.title)}`,
      `LOCATION:${this.escapeIcsText(event.location)}`,
      `DESCRIPTION:${this.escapeIcsText(event.description.slice(0, 2000))}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ];
    return `${lines.join('\r\n')}\r\n`;
  }

  async getPublicEvent(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const past = isEventPast(event);

    return {
      ...event,
      isPast: past,
      registrationOpen: isRegistrationOpen(event),
      registeredCount: event._count.registrations,
    };
  }

  listAdminEvents() {
    return this.prisma.event.findMany({
      orderBy: { startDateTime: 'desc' },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    });
  }

  async listEventRegistrations(eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.prisma.eventRegistration.findMany({
      where: { eventId },
      orderBy: { registeredAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async createEvent(dto: CreateEventDto, actorUserId: string) {
    validateEventStart(dto.startDateTime);
    if (dto.endDateTime) {
      validateEventEnd(dto.startDateTime, dto.endDateTime);
    }

    const event = await this.prisma.event.create({
      data: {
        title: dto.title,
        description: dto.description,
        location: dto.location,
        startDateTime: dto.startDateTime,
        endDateTime: dto.endDateTime,
        coverImageUrl: dto.coverImageUrl,
        capacity: dto.capacity,
        createdById: actorUserId,
      },
    });

    await this.auditService.log({
      actorUserId,
      action: 'CREATE_EVENT',
      entityType: 'EVENT',
      entityId: event.id,
    });

    return {
      message: 'Event created successfully.',
      eventId: event.id,
    };
  }

  async updateEvent(id: string, dto: UpdateEventDto, actorUserId: string) {
    const existing = await this.prisma.event.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Event not found');
    }

    if (dto.startDateTime) {
      const startChanged =
        dto.startDateTime.getTime() !== existing.startDateTime.getTime();
      if (startChanged) {
        validateEventStart(dto.startDateTime);
      }
    }
    const effectiveStart = dto.startDateTime ?? existing.startDateTime;
    if (dto.endDateTime) {
      validateEventEnd(effectiveStart, dto.endDateTime);
    }

    const event = await this.prisma.event.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        location: dto.location,
        startDateTime: dto.startDateTime,
        endDateTime: dto.endDateTime,
        coverImageUrl: dto.coverImageUrl,
        capacity: dto.capacity,
        registrationOpen: dto.registrationOpen,
      },
    });

    await this.auditService.log({
      actorUserId,
      action: 'UPDATE_EVENT',
      entityType: 'EVENT',
      entityId: event.id,
    });

    return {
      message: 'Event updated successfully.',
      event,
    };
  }

  async deleteEvent(id: string, actorUserId: string) {
    await this.prisma.event.delete({ where: { id } });
    await this.auditService.log({
      actorUserId,
      action: 'DELETE_EVENT',
      entityType: 'EVENT',
      entityId: id,
    });
    return { message: 'Event deleted successfully.' };
  }

  listPublicAlbums() {
    return this.prisma.mediaAlbum.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        assets: {
          orderBy: { createdAt: 'desc' },
          take: 8,
        },
        _count: {
          select: { assets: true },
        },
      },
    });
  }

  async getPublicAlbum(id: string) {
    const album = await this.prisma.mediaAlbum.findUnique({
      where: { id },
      include: {
        assets: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!album) {
      throw new NotFoundException('Album not found');
    }

    return album;
  }

  async createAlbum(dto: CreateMediaAlbumDto, actorUserId: string) {
    const album = await this.prisma.mediaAlbum.create({
      data: {
        title: dto.title,
        description: dto.description,
        coverImageUrl: dto.coverImageUrl,
        createdById: actorUserId,
      },
    });

    await this.auditService.log({
      actorUserId,
      action: 'CREATE_MEDIA_ALBUM',
      entityType: 'MEDIA_ALBUM',
      entityId: album.id,
    });

    return {
      message: 'Album created successfully.',
      albumId: album.id,
    };
  }

  async addMediaAsset(dto: CreateMediaAssetDto, actorUserId: string) {
    const asset = await this.prisma.mediaAsset.create({
      data: {
        url: dto.url,
        title: dto.title,
        albumId: dto.albumId,
        type: (dto.type as MediaType) ?? MediaType.IMAGE,
      },
    });

    await this.auditService.log({
      actorUserId,
      action: 'CREATE_MEDIA_ASSET',
      entityType: 'MEDIA_ASSET',
      entityId: asset.id,
      metadata: { albumId: dto.albumId } as Prisma.InputJsonValue,
    });

    return {
      message: 'Media asset created successfully.',
      assetId: asset.id,
    };
  }

  listPublishedNewsletters() {
    return this.prisma.newsletterIssue.findMany({
      where: { isPublished: true },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        slug: true,
        issueNumber: true,
        monthLabel: true,
        excerpt: true,
        pdfUrl: true,
        publishedAt: true,
      },
    });
  }

  async getPublishedNewsletter(slug: string) {
    const issue = await this.prisma.newsletterIssue.findFirst({
      where: { slug, isPublished: true },
    });
    if (!issue) {
      throw new NotFoundException('Newsletter not found');
    }
    return issue;
  }

  listAdminNewsletters() {
    return this.prisma.newsletterIssue.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createNewsletterIssue(
    input: {
      title: string;
      issueNumber: number;
      monthLabel: string;
      excerpt?: string;
      pdfUrl: string;
    },
    actorUserId: string,
  ) {
    if (!input.title?.trim()) {
      throw new BadRequestException('Title is required');
    }
    if (!input.monthLabel?.trim()) {
      throw new BadRequestException('Month is required');
    }
    if (!Number.isFinite(input.issueNumber) || input.issueNumber < 1) {
      throw new BadRequestException('Issue number is required');
    }

    const baseSlug = `issue-${input.issueNumber}-${input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')}`.slice(0, 80);

    let slug = baseSlug || `issue-${input.issueNumber}`;
    let n = 2;
    while (await this.prisma.newsletterIssue.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${n}`;
      n += 1;
    }

    const issue = await this.prisma.newsletterIssue.create({
      data: {
        title: input.title.trim(),
        slug,
        issueNumber: input.issueNumber,
        monthLabel: input.monthLabel.trim(),
        excerpt: input.excerpt?.trim() || null,
        pdfUrl: input.pdfUrl,
        isPublished: true,
        publishedAt: new Date(),
        createdById: actorUserId,
      },
    });

    await this.auditService.log({
      actorUserId,
      action: 'PUBLISH_NEWSLETTER',
      entityType: 'NEWSLETTER_ISSUE',
      entityId: issue.id,
    });

    return {
      message: 'Newsletter published on the public website.',
      issue,
    };
  }

  async deleteNewsletterIssue(id: string, actorUserId: string) {
    const existing = await this.prisma.newsletterIssue.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Newsletter not found');
    }
    await this.prisma.newsletterIssue.delete({ where: { id } });
    await this.auditService.log({
      actorUserId,
      action: 'DELETE_NEWSLETTER',
      entityType: 'NEWSLETTER_ISSUE',
      entityId: id,
    });
    return { message: 'Newsletter removed from the website.' };
  }
}
