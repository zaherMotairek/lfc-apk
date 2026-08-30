import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MembershipCardStatus, MembershipStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { MediaStorageService } from '../../common/services/media-storage.service';
import { normalizePhoneNumber } from '../../common/utils/member-identity';

@Injectable()
export class MembershipCardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly mediaStorageService: MediaStorageService,
  ) {}

  private async findRosterMatch(user: {
    olscId: string | null;
    lfcId: string | null;
    phoneNumber: string | null;
  }) {
    if (user.olscId) {
      const byOlsc = await this.prisma.officialMemberRoster.findUnique({
        where: { olscId: user.olscId },
      });
      if (byOlsc) return byOlsc;
    }

    if (user.lfcId) {
      const byLfc = await this.prisma.officialMemberRoster.findFirst({
        where: { lfcId: user.lfcId },
      });
      if (byLfc) return byLfc;
    }

    const phone = normalizePhoneNumber(user.phoneNumber);
    if (phone) {
      return this.prisma.officialMemberRoster.findFirst({
        where: { phoneNumber: phone },
      });
    }

    return null;
  }

  async generateCardForMembership(membershipId: string, userId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { id: membershipId },
      include: { user: true },
    });

    if (!membership || membership.userId !== userId) {
      throw new NotFoundException('Membership not found');
    }

    if (membership.status !== MembershipStatus.ACTIVE) {
      throw new NotFoundException('Active membership is required to generate a card');
    }

    const existingActiveCard = await this.prisma.membershipCard.findFirst({
      where: {
        userId,
        status: MembershipCardStatus.ACTIVE,
      },
    });

    if (existingActiveCard) {
      return existingActiveCard;
    }

    const displayName = `${membership.user.firstName} ${membership.user.lastName}`.trim();
    const secureToken = randomBytes(24).toString('hex');
    const cardNumber = `OLSC-${membership.seasonLabel.replace('/', '-')}-${membership.officialMemberId}`;

    return this.prisma.membershipCard.create({
      data: {
        membershipId: membership.id,
        userId,
        cardNumber,
        seasonLabel: membership.seasonLabel,
        displayName,
        officialMemberId: membership.officialMemberId,
        avatarUrl: membership.user.avatarUrl,
        cardImageUrl: membership.user.membershipCardImageUrl,
        physicalCardUploadedAt: membership.user.membershipCardUploadedAt,
        qrCodeValue: cardNumber,
        qrSecureToken: secureToken,
        status: MembershipCardStatus.ACTIVE,
        expiresAt: membership.seasonEndDate,
      },
    });
  }

  async getMyActiveCard(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const rosterMatch = await this.findRosterMatch(user);

    let card = await this.prisma.membershipCard.findFirst({
      where: {
        userId,
        status: MembershipCardStatus.ACTIVE,
      },
      include: {
        membership: true,
      },
    });

    if (!card) {
      const membership = await this.prisma.membership.findFirst({
        where: {
          userId,
          status: MembershipStatus.ACTIVE,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (membership) {
        await this.generateCardForMembership(membership.id, userId);
        card = await this.prisma.membershipCard.findFirst({
          where: {
            userId,
            status: MembershipCardStatus.ACTIVE,
          },
          include: {
            membership: true,
          },
        });
      }
    }

    const displayName =
      `${user.firstName} ${user.lastName}`.trim() ||
      rosterMatch?.fullName ||
      user.username ||
      'Member';

    if (card) {
      return {
        fullName: card.displayName || displayName,
        officialMemberId: card.officialMemberId,
        seasonLabel: card.seasonLabel,
        avatarUrl: card.avatarUrl,
        cardImageUrl: card.cardImageUrl ?? user.membershipCardImageUrl,
        physicalCardUploadedAt: card.physicalCardUploadedAt ?? user.membershipCardUploadedAt,
        cardNumber: card.cardNumber,
        qrCodeValue: card.qrCodeValue,
        qrSecureToken: card.qrSecureToken,
        membershipStatus: card.membership.status,
        membershipBadge: 'OFFICIAL_MEMBER' as const,
        rosterMatched: Boolean(rosterMatch),
        rosterMatch: rosterMatch
          ? {
              olscId: rosterMatch.olscId,
              lfcId: rosterMatch.lfcId,
              fullName: rosterMatch.fullName,
            }
          : null,
        issuedAt: card.issuedAt,
      };
    }

    return {
      fullName: displayName,
      officialMemberId: user.olscId ?? rosterMatch?.olscId ?? null,
      seasonLabel: null,
      avatarUrl: user.avatarUrl,
      cardImageUrl: user.membershipCardImageUrl,
      physicalCardUploadedAt: user.membershipCardUploadedAt,
      cardNumber: null,
      qrCodeValue: null,
      qrSecureToken: null,
      membershipStatus: rosterMatch ? 'MATCHED_ROSTER' : 'NOT_MEMBER',
      membershipBadge: rosterMatch ? ('MATCHED_ROSTER' as const) : ('NOT_MEMBER' as const),
      rosterMatched: Boolean(rosterMatch),
      rosterMatch: rosterMatch
        ? {
            olscId: rosterMatch.olscId,
            lfcId: rosterMatch.lfcId,
            fullName: rosterMatch.fullName,
          }
        : null,
      issuedAt: null,
    };
  }

  async uploadPhysicalCard(userId: string, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Card image file is required');
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG and WebP images are allowed');
    }

    const cardImageUrl = await this.mediaStorageService.uploadMembershipCard(userId, file);
    const uploadedAt = new Date();

    let card = await this.prisma.membershipCard.findFirst({
      where: {
        userId,
        status: MembershipCardStatus.ACTIVE,
      },
    });

    if (!card) {
      const membership = await this.prisma.membership.findFirst({
        where: {
          userId,
          status: MembershipStatus.ACTIVE,
        },
        orderBy: { createdAt: 'desc' },
      });
      if (membership) {
        card = await this.generateCardForMembership(membership.id, userId);
      }
    }

    if (card) {
      const updated = await this.prisma.membershipCard.update({
        where: { id: card.id },
        data: {
          cardImageUrl,
          physicalCardUploadedAt: uploadedAt,
        },
      });

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          membershipCardImageUrl: cardImageUrl,
          membershipCardUploadedAt: uploadedAt,
        },
      });

      await this.auditService.log({
        actorUserId: userId,
        action: 'UPLOAD_PHYSICAL_MEMBERSHIP_CARD',
        entityType: 'MEMBERSHIP_CARD',
        entityId: card.id,
      });

      return {
        message: 'Membership card photo uploaded successfully.',
        cardImageUrl: updated.cardImageUrl,
        physicalCardUploadedAt: updated.physicalCardUploadedAt,
      };
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        membershipCardImageUrl: cardImageUrl,
        membershipCardUploadedAt: uploadedAt,
      },
    });

    await this.auditService.log({
      actorUserId: userId,
      action: 'UPLOAD_PHYSICAL_MEMBERSHIP_CARD',
      entityType: 'USER',
      entityId: userId,
    });

    return {
      message: 'Membership card photo uploaded successfully.',
      cardImageUrl,
      physicalCardUploadedAt: uploadedAt,
    };
  }

  async verifyCard(token: string, verifiedById: string, eventId?: string) {
    const card = await this.prisma.membershipCard.findUnique({
      where: { qrSecureToken: token },
      include: {
        membership: true,
        user: true,
      },
    });

    if (!card) {
      return {
        result: 'NOT_FOUND',
        message: 'Membership card not found',
      };
    }

    let result = 'VALID';
    if (card.status === MembershipCardStatus.EXPIRED) {
      result = 'EXPIRED';
    } else if (card.status === MembershipCardStatus.REVOKED) {
      result = 'REVOKED';
    } else if (card.membership.status !== MembershipStatus.ACTIVE) {
      result = 'MEMBERSHIP_INACTIVE';
    }

    await this.prisma.membershipCardVerification.create({
      data: {
        membershipCardId: card.id,
        verifiedById,
        eventId,
        result,
      },
    });

    return {
      result,
      member: {
        fullName: `${card.user.firstName} ${card.user.lastName}`,
        officialMemberId: card.officialMemberId,
        seasonLabel: card.seasonLabel,
        membershipStatus: card.membership.status,
        avatarUrl: card.avatarUrl,
      },
    };
  }
}
