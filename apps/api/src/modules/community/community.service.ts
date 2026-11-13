import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MatchStatus, NewsStatus, RegistrationStatus } from '@prisma/client';
import { isEventPast } from '../../common/utils/event.utils';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { SiteSettingsService } from '../site-settings/site-settings.service';
import { MembershipCardsService } from '../members/membership-cards.service';
import { PushDispatchService } from '../../common/services/push-dispatch.service';
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
    private readonly siteSettingsService: SiteSettingsService,
    private readonly membershipCardsService: MembershipCardsService,
    private readonly pushDispatch: PushDispatchService,
  ) {}

  private firePush(userId: string, title: string, message: string) {
    void this.pushDispatch
      .sendToUser(userId, { title, body: message })
      .catch(() => undefined);
  }

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
    const maxGuests = await this.siteSettingsService.getMaxGuests();
    const guestCount = dto.guestCount ?? 0;
    if (guestCount < 0 || guestCount > maxGuests) {
      throw new BadRequestException(`guestCount must be between 0 and ${maxGuests}`);
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

    const eventTitle =
      status === 'WAITLISTED' ? 'Added to waitlist' : 'Event registration confirmed';
    const eventMessage =
      status === 'WAITLISTED'
        ? `You are waitlisted for ${event.title}.`
        : `You are registered for ${event.title}.`;
    await this.prisma.notification.create({
      data: {
        userId,
        type: 'EVENT_UPDATE',
        title: eventTitle,
        message: eventMessage,
      },
    });
    this.firePush(userId, eventTitle, eventMessage);

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
      where: { newsArticleId: newsId, isHidden: false },
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
        where: { type: 'overall', user: { hideFromLeaderboard: false } },
        orderBy: [{ periodEnd: 'desc' }, { rank: 'asc' }],
        take: 10,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              hideFromLeaderboard: true,
            },
          },
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

  async listRecentCommentsForAdmin(limit = 80) {
    const take = Math.min(Math.max(limit, 1), 200);
    return this.prisma.comment.findMany({
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        newsArticle: { select: { id: true, title: true, slug: true } },
      },
    });
  }

  async hideComment(commentId: string, actorUserId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    await this.prisma.comment.update({
      where: { id: commentId },
      data: { isHidden: true },
    });
    await this.auditService.log({
      actorUserId,
      action: 'HIDE_NEWS_COMMENT',
      entityType: 'COMMENT',
      entityId: commentId,
    });
    return { message: 'Comment hidden from members.' };
  }

  async deleteComment(commentId: string, actorUserId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    await this.prisma.comment.delete({ where: { id: commentId } });
    await this.auditService.log({
      actorUserId,
      action: 'DELETE_NEWS_COMMENT',
      entityType: 'COMMENT',
      entityId: commentId,
    });
    return { message: 'Comment deleted.' };
  }

  getPushConfig() {
    const publicKey = process.env.VAPID_PUBLIC_KEY?.trim() || null;
    return {
      publicKey,
      supported: Boolean(publicKey),
    };
  }

  async registerPushSubscription(
    userId: string,
    body: { endpoint: string; keys: { p256dh: string; auth: string } },
  ) {
    const pushOn = await this.siteSettingsService.getPublicSettings();
    if (pushOn['features.pushEnabled'] === 'false') {
      throw new BadRequestException('Push notifications are disabled.');
    }
    if (!body.endpoint?.trim() || !body.keys?.p256dh || !body.keys?.auth) {
      throw new BadRequestException('Invalid push subscription payload');
    }

    const row = await this.prisma.pushSubscription.upsert({
      where: { endpoint: body.endpoint.trim() },
      create: {
        userId,
        endpoint: body.endpoint.trim(),
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
      },
      update: {
        userId,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
      },
    });

    await this.auditService.log({
      actorUserId: userId,
      action: 'REGISTER_PUSH_SUBSCRIPTION',
      entityType: 'PUSH_SUBSCRIPTION',
      entityId: row.id,
    });

    return { message: 'Push subscription saved.' };
  }

  async unregisterPushSubscription(userId: string, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({
      where: { userId, endpoint: endpoint.trim() },
    });
    return { message: 'Push subscription removed.' };
  }

  async adminBroadcastPush(actorUserId: string, dto: { title: string; body: string; url?: string }) {
    const pushOn = await this.siteSettingsService.getPublicSettings();
    if (pushOn['features.pushEnabled'] === 'false') {
      throw new BadRequestException('Push notifications are disabled in site settings.');
    }

    const title = dto.title.trim();
    const body = dto.body.trim();
    if (!title || !body) {
      throw new BadRequestException('Title and body are required.');
    }

    const result = await this.pushDispatch.broadcast({
      title,
      body,
      url: dto.url?.trim() || undefined,
    });

    await this.auditService.log({
      actorUserId,
      action: 'ADMIN_PUSH_BROADCAST',
      entityType: 'PUSH_BROADCAST',
      metadata: { title, ...result },
    });

    return {
      message: result.skipped
        ? `Push skipped: ${result.reason ?? 'not configured'}`
        : `Push delivered to ${result.sent} device(s).`,
      ...result,
    };
  }

  async staffEventCheckIn(eventId: string, qrToken: string, staffUserId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const verify = await this.membershipCardsService.verifyCard(qrToken.trim(), staffUserId, eventId);
    if (verify.result !== 'VALID' || !('member' in verify)) {
      return verify;
    }

    const card = await this.prisma.membershipCard.findUnique({
      where: { qrSecureToken: qrToken.trim() },
      select: { userId: true },
    });
    if (!card) {
      return verify;
    }

    const registration = await this.prisma.eventRegistration.findUnique({
      where: { userId_eventId: { userId: card.userId, eventId } },
    });

    if (registration && registration.status !== RegistrationStatus.CANCELED) {
      await this.prisma.eventRegistration.update({
        where: { id: registration.id },
        data: {
          status: RegistrationStatus.ATTENDED,
          attendanceMarkedAt: new Date(),
        },
      });
    }

    await this.auditService.log({
      actorUserId: staffUserId,
      action: 'EVENT_QR_CHECK_IN',
      entityType: 'EVENT',
      entityId: eventId,
      metadata: { memberUserId: card.userId, qrResult: verify.result },
    });

    return {
      ...verify,
      attendanceMarked: Boolean(registration),
      guests: registration?.guestCount ?? 0,
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
