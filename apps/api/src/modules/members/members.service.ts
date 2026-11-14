import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  InvitationStatus,
  MembershipSource,
  MembershipStatus,
  PlatformAccountStatus,
  Prisma,
  RegistrationStatus,
  RoleCode,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { EmailService } from '../../common/services/email.service';
import { isDevTokenExposureAllowed } from '../../common/utils/environment';
import { CreateMemberDto } from './dto/create-member.dto';
import { ImportMembersDto } from './dto/import-members.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { UpdateMembershipStatusDto } from './dto/update-membership-status.dto';
import { parseOfficialMembersCsv } from './roster-import.util';
import {
  normalizeMemberId,
  normalizePhoneNumber,
  emailLocalPart,
} from '../../common/utils/member-identity';
import { MembershipCardsService } from './membership-cards.service';

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly membershipCardsService: MembershipCardsService,
  ) {}

  async listDirectoryMembers() {
    const users = await this.prisma.user.findMany({
      where: {
        listedInDirectory: true,
        platformAccountStatus: PlatformAccountStatus.ACTIVE,
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 200,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        city: true,
        favoritePlayer: true,
        createdAt: true,
      },
    });
    return users.map((user) => ({
      ...user,
      displayName: `${user.firstName} ${user.lastName}`.trim(),
      memberSince: user.createdAt,
    }));
  }

  async listMembers() {
    const [users, roster] = await Promise.all([
      this.prisma.user.findMany({
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        include: {
          memberships: {
            orderBy: { createdAt: 'desc' },
          },
          roles: {
            include: { role: true },
          },
          invitations: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.officialMemberRoster.findMany(),
    ]);

    const rosterByOlsc = new Map(roster.map((item) => [item.olscId, item]));
    const rosterByLfc = new Map(
      roster.filter((item) => item.lfcId).map((item) => [item.lfcId as string, item]),
    );
    const rosterByPhone = new Map(
      roster
        .filter((item) => item.phoneNumber)
        .map((item) => [item.phoneNumber as string, item]),
    );

    return users.map((user) => {
      const activeMembership =
        user.memberships.find((item) => item.status === MembershipStatus.ACTIVE) ??
        user.memberships[0];

      const rosterMatch =
        (user.olscId ? rosterByOlsc.get(user.olscId) : undefined) ??
        (activeMembership ? rosterByOlsc.get(activeMembership.officialMemberId) : undefined) ??
        (user.lfcId ? rosterByLfc.get(user.lfcId) : undefined) ??
        (user.phoneNumber ? rosterByPhone.get(normalizePhoneNumber(user.phoneNumber) ?? '') : undefined);

      let membershipBadge: 'OFFICIAL_MEMBER' | 'MATCHED_ROSTER' | 'NOT_MEMBER' = 'NOT_MEMBER';
      if (activeMembership?.status === MembershipStatus.ACTIVE) {
        membershipBadge = 'OFFICIAL_MEMBER';
      } else if (rosterMatch) {
        membershipBadge = 'MATCHED_ROSTER';
      }

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        olscId: user.olscId,
        lfcId: user.lfcId,
        favoritePlayer: user.favoritePlayer,
        platformAccountStatus: user.platformAccountStatus,
        membershipBadge,
        rosterMatch: rosterMatch
          ? {
              olscId: rosterMatch.olscId,
              lfcId: rosterMatch.lfcId,
              fullName: rosterMatch.fullName,
              phoneNumber: rosterMatch.phoneNumber,
            }
          : null,
        level: user.level,
        xp: user.xp,
        coins: user.coins,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        lastSeenAt: user.lastSeenAt,
        roles: user.roles.map((item) => item.role.code),
        memberships: user.memberships.map((membership) => ({
          id: membership.id,
          officialMemberId: membership.officialMemberId,
          seasonLabel: membership.seasonLabel,
          status: membership.status,
          notes: membership.notes,
        })),
        latestInvitation: user.invitations[0]
          ? {
              status: user.invitations[0].status,
              expiresAt: user.invitations[0].expiresAt,
              createdAt: user.invitations[0].createdAt,
            }
          : null,
      };
    });
  }

  async importOfficialRoster(fileContent: string, actorUserId: string) {
    const rows = parseOfficialMembersCsv(fileContent);
    const importBatch = `batch_${Date.now()}`;
    let upserted = 0;

    for (const row of rows) {
      await this.prisma.officialMemberRoster.upsert({
        where: { olscId: row.olscId },
        create: {
          olscId: row.olscId,
          lfcId: row.lfcId,
          fullName: row.fullName,
          phoneNumber: row.phoneNumber,
          rawStatus: row.rawStatus,
          importBatch,
        },
        update: {
          lfcId: row.lfcId,
          fullName: row.fullName,
          phoneNumber: row.phoneNumber,
          rawStatus: row.rawStatus,
          importBatch,
        },
      });
      upserted += 1;
    }

    await this.auditService.log({
      actorUserId,
      action: 'IMPORT_OFFICIAL_ROSTER',
      entityType: 'OFFICIAL_MEMBER_ROSTER',
      metadata: {
        importBatch,
        upserted,
      },
    });

    return {
      message: 'Official member list imported successfully.',
      imported: upserted,
      importBatch,
    };
  }

  async getRosterSummary() {
    const total = await this.prisma.officialMemberRoster.count();
    const latest = await this.prisma.officialMemberRoster.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
    return {
      total,
      latestImportBatch: latest?.importBatch ?? null,
      updatedAt: latest?.updatedAt ?? null,
    };
  }

  async deleteUser(userId: string, actorUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.roles.some((item) => item.role.code === RoleCode.SUPER_ADMIN)) {
      throw new BadRequestException('Cannot delete a SUPER_ADMIN account');
    }

    if (userId === actorUserId) {
      throw new BadRequestException('You cannot delete your own account');
    }

    await this.prisma.user.delete({ where: { id: userId } });

    await this.auditService.log({
      actorUserId,
      action: 'DELETE_USER',
      entityType: 'USER',
      entityId: userId,
      metadata: {
        email: user.email,
      },
    });

    return {
      message: 'User deleted successfully.',
    };
  }

  async updateMember(userId: string, dto: UpdateMemberDto, actorUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const nextEmail = dto.email?.toLowerCase();
    if (nextEmail && nextEmail !== user.email) {
      const existingEmail = await this.prisma.user.findUnique({ where: { email: nextEmail } });
      if (existingEmail) {
        throw new ConflictException('A user with this email already exists');
      }
    }

    const activeMembership =
      user.memberships.find((item) => item.status === MembershipStatus.ACTIVE) ??
      user.memberships[0];

    if (dto.officialMemberId && activeMembership) {
      const existingMemberId = await this.prisma.membership.findUnique({
        where: { officialMemberId: dto.officialMemberId },
      });
      if (existingMemberId && existingMemberId.id !== activeMembership.id) {
        throw new ConflictException('This official member ID already exists');
      }
    }

    const nextOlscId =
      dto.olscId === undefined ? user.olscId : normalizeMemberId(dto.olscId);
    const nextLfcId =
      dto.lfcId === undefined ? user.lfcId : normalizeMemberId(dto.lfcId);

    if (nextOlscId && nextOlscId !== user.olscId) {
      const existingOlsc = await this.prisma.user.findUnique({ where: { olscId: nextOlscId } });
      if (existingOlsc) {
        throw new ConflictException('This OLSC ID is already linked to another account');
      }
    }

    if (nextLfcId && nextLfcId !== user.lfcId) {
      const existingLfc = await this.prisma.user.findUnique({ where: { lfcId: nextLfcId } });
      if (existingLfc) {
        throw new ConflictException('This ALLRED SUPPORT ID is already linked to another account');
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const nextUser = await tx.user.update({
        where: { id: userId },
        data: {
          firstName: dto.firstName ?? user.firstName,
          lastName: dto.lastName ?? user.lastName,
          email: nextEmail ?? user.email,
          phoneNumber:
            dto.phoneNumber === undefined
              ? user.phoneNumber
              : normalizePhoneNumber(dto.phoneNumber),
          favoritePlayer:
            dto.favoritePlayer === undefined
              ? user.favoritePlayer
              : dto.favoritePlayer || null,
          olscId: nextOlscId,
          lfcId: nextLfcId,
        },
      });

      if (activeMembership && (dto.officialMemberId || dto.seasonLabel || dto.notes !== undefined)) {
        await tx.membership.update({
          where: { id: activeMembership.id },
          data: {
            officialMemberId: dto.officialMemberId ?? activeMembership.officialMemberId,
            seasonLabel: dto.seasonLabel ?? activeMembership.seasonLabel,
            notes: dto.notes === undefined ? activeMembership.notes : dto.notes || null,
          },
        });
      }

      return nextUser;
    });

    await this.auditService.log({
      actorUserId,
      action: 'UPDATE_MEMBER',
      entityType: 'USER',
      entityId: userId,
      metadata: {
        email: updated.email,
        officialMemberId: dto.officialMemberId,
      },
    });

    return {
      message: 'Member updated successfully.',
      userId: updated.id,
    };
  }

  async createMember(dto: CreateMemberDto, actorUserId: string) {
    const email = dto.email.toLowerCase();

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const existingMemberId = await this.prisma.membership.findUnique({
      where: { officialMemberId: dto.officialMemberId },
    });
    if (existingMemberId) {
      throw new ConflictException('This official member ID already exists');
    }

    const memberRole = await this.prisma.role.findUnique({
      where: { code: RoleCode.MEMBER },
    });
    if (!memberRole) {
      throw new BadRequestException('MEMBER role is missing. Run database seed first.');
    }

    const username = await this.resolveAvailableUsername(email);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email,
          ...(username ? { username } : {}),
          phoneNumber: dto.phoneNumber,
          platformAccountStatus: PlatformAccountStatus.INVITED,
          roles: {
            create: {
              roleId: memberRole.id,
              assignedById: actorUserId,
            },
          },
          memberships: {
            create: {
              officialMemberId: dto.officialMemberId,
              seasonLabel: dto.seasonLabel,
              status: MembershipStatus.ACTIVE,
              source: MembershipSource.MANUAL,
              notes: dto.notes,
              createdById: actorUserId,
              activatedAt: new Date(),
            },
          },
        },
        include: {
          memberships: true,
        },
      });

      let invitationToken: string | null = null;
      if (dto.sendInvitation !== false) {
        invitationToken = await this.createInvitation(tx, user.id, email, actorUserId);
      }

      return { user, invitationToken };
    });

    await this.auditService.log({
      actorUserId,
      action: 'CREATE_MEMBER',
      entityType: 'USER',
      entityId: result.user.id,
      metadata: {
        officialMemberId: dto.officialMemberId,
        seasonLabel: dto.seasonLabel,
      },
    });

    const invitationLink = result.invitationToken
      ? `${this.configService.get<string>('APP_URL')}/accept-invitation?token=${result.invitationToken}`
      : null;

    if (invitationLink && result.invitationToken) {
      await this.emailService.sendInvitationEmail(
        email,
        dto.firstName,
        invitationLink,
      );
    }

    return this.buildInvitationResponse(
      'Member created successfully.',
      result.user.id,
      result.invitationToken,
      invitationLink,
    );
  }

  async importMembers(dto: ImportMembersDto, actorUserId: string) {
    const results: Array<{
      email: string;
      status: 'created' | 'failed';
      reason?: string;
      invitationToken?: string | null;
    }> = [];

    for (const member of dto.members) {
      try {
        const created = await this.createMember(
          {
            ...member,
            sendInvitation: dto.sendInvitations !== false,
          },
          actorUserId,
        );
        results.push({
          email: member.email.toLowerCase(),
          status: 'created',
          invitationToken: created.invitationToken,
        });
      } catch (error) {
        results.push({
          email: member.email.toLowerCase(),
          status: 'failed',
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    await this.auditService.log({
      actorUserId,
      action: 'IMPORT_MEMBERS',
      entityType: 'MEMBERSHIP',
      metadata: {
        total: dto.members.length,
        created: results.filter((item) => item.status === 'created').length,
        failed: results.filter((item) => item.status === 'failed').length,
      },
    });

    return {
      message: 'Member import processed.',
      results,
    };
  }

  async updateMembershipStatus(
    membershipId: string,
    dto: UpdateMembershipStatusDto,
    actorUserId: string,
  ) {
    const membership = await this.prisma.membership.findUnique({
      where: { id: membershipId },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    if (dto.status === MembershipStatus.ACTIVE) {
      await this.prisma.membership.updateMany({
        where: {
          userId: membership.userId,
          status: MembershipStatus.ACTIVE,
          NOT: { id: membershipId },
        },
        data: {
          status: MembershipStatus.EXPIRED,
          expiredAt: new Date(),
        },
      });
    }

    const updated = await this.prisma.membership.update({
      where: { id: membershipId },
      data: {
        status: dto.status,
        notes: dto.notes ?? membership.notes,
        activatedAt:
          dto.status === MembershipStatus.ACTIVE ? new Date() : membership.activatedAt,
        expiredAt:
          dto.status === MembershipStatus.EXPIRED ? new Date() : membership.expiredAt,
        suspendedAt:
          dto.status === MembershipStatus.SUSPENDED ? new Date() : membership.suspendedAt,
      },
    });

    await this.auditService.log({
      actorUserId,
      action: 'UPDATE_MEMBERSHIP_STATUS',
      entityType: 'MEMBERSHIP',
      entityId: membershipId,
      metadata: {
        previousStatus: membership.status,
        nextStatus: dto.status,
      },
    });

    return {
      message: 'Membership status updated successfully.',
      membership: updated,
    };
  }

  async inviteMember(userId: string, actorUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.platformAccountStatus === PlatformAccountStatus.ACTIVE) {
      throw new BadRequestException('User account is already active');
    }

    await this.prisma.memberInvitation.updateMany({
      where: {
        userId,
        status: InvitationStatus.PENDING,
      },
      data: {
        status: InvitationStatus.REVOKED,
        revokedAt: new Date(),
      },
    });

    const token = await this.prisma.$transaction(async (tx) =>
      this.createInvitation(tx, user.id, user.email, actorUserId),
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: { platformAccountStatus: PlatformAccountStatus.INVITED },
    });

    await this.auditService.log({
      actorUserId,
      action: 'INVITE_MEMBER',
      entityType: 'USER',
      entityId: user.id,
    });

    const invitationLink = `${this.configService.get<string>('APP_URL')}/accept-invitation?token=${token}`;

    await this.emailService.sendInvitationEmail(user.email, user.firstName, invitationLink);

    return this.buildInvitationResponse(
      'Invitation sent successfully.',
      user.id,
      token,
      invitationLink,
    );
  }

  private buildInvitationResponse(
    message: string,
    userId: string,
    invitationToken: string | null,
    invitationLink: string | null,
  ) {
    const emailSent = this.emailService.isConfigured();
    const response: {
      message: string;
      userId: string;
      emailSent: boolean;
      invitationToken?: string | null;
      invitationLink?: string | null;
    } = {
      message,
      userId,
      emailSent,
    };

    if (isDevTokenExposureAllowed() && !emailSent) {
      response.invitationToken = invitationToken;
      response.invitationLink = invitationLink;
    }

    return response;
  }

  private async resolveAvailableUsername(email: string): Promise<string | null> {
    const local = emailLocalPart(email);
    if (!local) {
      return null;
    }

    const taken = await this.prisma.user.findUnique({ where: { username: local } });
    return taken ? null : local;
  }

  private async createInvitation(
    tx: Prisma.TransactionClient,
    userId: string,
    email: string,
    invitedById: string,
  ) {
    const hours = Number(this.configService.get('INVITATION_TOKEN_TTL_HOURS') ?? 72);
    const token = randomBytes(32).toString('hex');

    await tx.memberInvitation.create({
      data: {
        userId,
        email,
        token,
        invitedById,
        expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000),
        status: InvitationStatus.PENDING,
      },
    });

    return token;
  }

  async getMemberActivity(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        lfcId: true,
        olscId: true,
        platformAccountStatus: true,
        lastLoginAt: true,
        lastSeenAt: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [loginCount, predictionCount, eventRegistrations, commentCount, recentLogins] =
      await Promise.all([
        this.prisma.loginEvent.count({ where: { userId } }),
        this.prisma.prediction.count({ where: { userId } }),
        this.prisma.eventRegistration.count({
          where: { userId, status: { not: RegistrationStatus.CANCELED } },
        }),
        this.prisma.comment.count({ where: { userId } }),
        this.prisma.loginEvent.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 12,
          select: { id: true, createdAt: true },
        }),
      ]);

    return {
      user,
      loginCount,
      predictionCount,
      eventRegistrations,
      commentCount,
      recentLogins,
    };
  }
}
