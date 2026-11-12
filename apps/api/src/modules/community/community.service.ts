import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MatchStatus, NewsStatus, RegistrationStatus } from '@prisma/client';
import { isEventPast } from '../../common/utils/event.utils';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import {
  AddNewsCommentDto,
  RegisterEventDto,
  SetNewsReactionDto,
} from './dto/community.dto';

@Injectable()
export class CommunityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getCommunityFeed(limit = 30) {
    const [latestNews, latestEvents, latestAchievements] = await Promise.all([
      this.prisma.newsArticle.findMany({
        where: { status: NewsStatus.PUBLISHED },
        orderBy: { publishedAt: 'desc' },
        take: Math.max(10, Math.ceil(limit / 2)),
        select: {
          id: true,
          title: true,
          slug: true,
          publishedAt: true,
          author: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prisma.event.findMany({
        orderBy: { startDateTime: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          startDateTime: true,
          location: true,
        },
      }),
      this.prisma.userAchievement.findMany({
        orderBy: { unlockedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          unlockedAt: true,
          user: { select: { firstName: true, lastName: true } },
          achievement: { select: { code: true, name: true } },
        },
      }),
      Promise.resolve([]),
    ]);

    return [
      ...latestNews.map((item) => ({
        id: `news-${item.id}`,
        type: 'NEWS_PUBLISHED',
        createdAt: item.publishedAt ?? new Date(),
        title: item.title,
        subtitle: `By ${item.author.firstName} ${item.author.lastName}`,
        link: `/news/${item.slug}`,
      })),
      ...latestEvents.map((item) => ({
        id: `event-${item.id}`,
        type: 'EVENT_CREATED',
        createdAt: item.startDateTime,
        title: item.title,
        subtitle: `${item.location} · ${new Date(item.startDateTime).toLocaleDateString()}`,
        link: `/events/${item.id}`,
      })),
      ...latestAchievements.map((item) => ({
        id: `achievement-${item.id}`,
        type: 'ACHIEVEMENT_UNLOCKED',
        createdAt: item.unlockedAt,
        title: `${item.user.firstName} ${item.user.lastName} unlocked ${item.achievement.name}`,
        subtitle: item.achievement.code,
        link: '/app/hall-of-fame',
      })),
    ]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, limit);
  }

  private async countEventAttendeeSeats(eventId: string) {
    const registrations = await this.prisma.eventRegistration.findMany({
      where: {
        eventId,
        status: {
          in: [
            RegistrationStatus.REGISTERED,
            RegistrationStatus.WAITLISTED,
            RegistrationStatus.ATTENDED,
          ],
        },
      },
      select: { guestCount: true },
    });
    return registrations.reduce((sum, row) => sum + 1 + (row.guestCount ?? 0), 0);
  }

  async registerToEvent(eventId: string, userId: string, dto: RegisterEventDto) {
    const guestCount = dto.guestCount ?? 0;
    if (guestCount < 0 || guestCount > 2) {
      throw new BadRequestException('guestCount must be between 0 and 2');
    }

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    if (isEventPast(event)) {
      throw new BadRequestException('This event has already taken place');
    }
    if (!event.registrationOpen) {
      throw new BadRequestException('Registration is closed');
    }

    const existing = await this.prisma.eventRegistration.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (existing && existing.status !== RegistrationStatus.CANCELED) {
      throw new BadRequestException('You are already registered to this event');
    }

    const seatsUsed = await this.countEventAttendeeSeats(eventId);
    const seatsRequested = 1 + guestCount;
    const capacityReached =
      typeof event.capacity === 'number' && seatsUsed + seatsRequested > event.capacity;
    const status =
      capacityReached && dto.joinWaitlist
        ? RegistrationStatus.WAITLISTED
        : capacityReached
          ? RegistrationStatus.CANCELED
          : RegistrationStatus.REGISTERED;

    if (capacityReached && !dto.joinWaitlist) {
      throw new BadRequestException(
        'Event is full. Submit with joinWaitlist=true to join waitlist.',
      );
    }

    await this.prisma.eventRegistration.upsert({
      where: { userId_eventId: { userId, eventId } },
      update: {
        status,
        guestCount,
        guestNames: dto.guestNames?.trim() || null,
        registeredAt: new Date(),
      },
      create: {
        userId,
        eventId,
        status,
        guestCount,
        guestNames: dto.guestNames?.trim() || null,
        registeredAt: new Date(),
      },
    });

    await this.prisma.notification.create({
      data: {
        userId,
        type: 'EVENT_UPDATE',
        title: status === 'WAITLISTED' ? 'Added to waitlist' : 'Event registration confirmed',
        message:
          status === 'WAITLISTED'
            ? `You are waitlisted for ${event.title}.`
            : `You are registered for ${event.title}.`,
      },
    });

    await this.auditService.log({
      actorUserId: userId,
      action: 'REGISTER_EVENT',
      entityType: 'EVENT',
      entityId: eventId,
      metadata: { status, joinWaitlist: Boolean(dto.joinWaitlist) },
    });

    return {
      message:
        status === RegistrationStatus.WAITLISTED
          ? 'Added to waiting list.'
          : 'Event registration completed.',
      status,
    };
  }

  async cancelEventRegistration(eventId: string, userId: string) {
    const existing = await this.prisma.eventRegistration.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (!existing) {
      throw new NotFoundException('Registration not found');
    }

    await this.prisma.eventRegistration.update({
      where: { userId_eventId: { userId, eventId } },
      data: { status: RegistrationStatus.CANCELED },
    });

    await this.prisma.notification.create({
      data: {
        userId,
        type: 'EVENT_UPDATE',
        title: 'Event registration cancelled',
        message: 'Your registration has been cancelled.',
      },
    });

    return { message: 'Registration cancelled.' };
  }

  async getMyNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async markNotificationRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });

    return { message: 'Notification marked as read.' };
  }

  async listNewsComments(newsId: string) {
    await this.ensureNewsExists(newsId);
    return this.prisma.comment.findMany({
      where: { newsArticleId: newsId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });
  }

  async addNewsComment(newsId: string, userId: string, dto: AddNewsCommentDto) {
    await this.ensureNewsExists(newsId);
    const comment = await this.prisma.comment.create({
      data: {
        newsArticleId: newsId,
        userId,
        content: dto.content.trim(),
      },
    });

    await this.auditService.log({
      actorUserId: userId,
      action: 'CREATE_NEWS_COMMENT',
      entityType: 'NEWS_ARTICLE',
      entityId: newsId,
      metadata: { commentId: comment.id },
    });

    return { message: 'Comment added successfully.', commentId: comment.id };
  }

  async setNewsReaction(newsId: string, userId: string, dto: SetNewsReactionDto) {
    await this.ensureNewsExists(newsId);
    const existing = await this.prisma.reaction.findUnique({
      where: { userId_newsArticleId_type: { newsArticleId: newsId, userId, type: dto.reactionType } },
    });

    if (existing) {
      await this.prisma.reaction.delete({ where: { id: existing.id } });
      return { message: 'Reaction removed.' };
    }

    await this.prisma.reaction.create({
      data: {
        newsArticleId: newsId,
        userId,
        type: dto.reactionType,
      },
    });
    return { message: 'Reaction added.' };
  }

  async getNewsReactionsSummary(newsId: string) {
    await this.ensureNewsExists(newsId);
    const grouped = await this.prisma.reaction.groupBy({
      by: ['type'],
      where: { newsArticleId: newsId },
      _count: { _all: true },
    });
    return grouped.map((item) => ({
      reactionType: item.type,
      count: item._count._all,
    }));
  }

  async getHallOfFame() {
    const [king, topPredictors, recentAchievements] = await Promise.all([
      this.prisma.userAchievement.findFirst({
        where: { achievement: { code: 'KING_OF_THE_KOP' } },
        orderBy: { unlockedAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          achievement: { select: { code: true, name: true, description: true } },
        },
      }),
      this.prisma.leaderboardSnapshot.findMany({
        where: { type: 'overall' },
        orderBy: [{ periodEnd: 'desc' }, { rank: 'asc' }],
        take: 10,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      }),
      this.prisma.userAchievement.findMany({
        orderBy: { unlockedAt: 'desc' },
        take: 25,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          achievement: { select: { code: true, name: true, description: true } },
        },
      }),
    ]);

    return {
      currentKingOfTheKop: king,
      topPredictors,
      recentAchievements,
    };
  }

  private async ensureNewsExists(newsId: string) {
    const article = await this.prisma.newsArticle.findUnique({
      where: { id: newsId },
      select: { id: true },
    });
    if (!article) {
      throw new NotFoundException('Article not found');
    }
  }
}
