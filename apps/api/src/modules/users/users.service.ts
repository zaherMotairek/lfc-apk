import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { PermissionCode, RoleCode } from '@kop/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuditService } from '../../common/services/audit.service';
import { MediaStorageService } from '../../common/services/media-storage.service';
import { normalizeMemberId, normalizePhoneNumber } from '../../common/utils/member-identity';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly mediaStorageService: MediaStorageService,
  ) {}

  async getAuthenticatedUser(userId: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const roles = user.roles.map((item) => item.role.code as RoleCode);
    const permissions = Array.from(
      new Set(
        user.roles.flatMap((item) =>
          item.role.permissions.map(
            (rolePermission) => rolePermission.permission.code as PermissionCode,
          ),
        ),
      ),
    );

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
      permissions,
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          orderBy: { createdAt: 'desc' },
        },
        membershipCards: {
          where: { status: 'ACTIVE' },
          take: 1,
        },
        roles: {
          include: { role: true },
        },
        achievements: {
          include: {
            achievement: true,
          },
          orderBy: {
            unlockedAt: 'desc',
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      phoneNumber: user.phoneNumber,
      favoritePlayer: user.favoritePlayer,
      olscId: user.olscId,
      lfcId: user.lfcId,
      platformAccountStatus: user.platformAccountStatus,
      level: user.level,
      xp: user.xp,
      coins: user.coins,
      currentWinningStreak: user.currentWinningStreak,
      longestWinningStreak: user.longestWinningStreak,
      roles: user.roles.map((item) => item.role.code),
      memberships: user.memberships,
      activeCard: user.membershipCards[0] ?? null,
      achievements: user.achievements.map((item) => ({
        code: item.achievement.code,
        name: item.achievement.name,
        description: item.achievement.description,
        icon: item.achievement.icon,
        unlockedAt: item.unlockedAt,
      })),
    };
  }

  async updateMe(userId: string, dto: UpdateProfileDto) {
    const nextOlscId = dto.olscId === undefined ? undefined : normalizeMemberId(dto.olscId);
    const nextLfcId = dto.lfcId === undefined ? undefined : normalizeMemberId(dto.lfcId);

    if (nextOlscId) {
      const existingOlsc = await this.prisma.user.findFirst({
        where: { olscId: nextOlscId, NOT: { id: userId } },
      });
      if (existingOlsc) {
        throw new ConflictException('This OLSC ID is already linked to another account');
      }
    }

    if (nextLfcId) {
      const existingLfc = await this.prisma.user.findFirst({
        where: { lfcId: nextLfcId, NOT: { id: userId } },
      });
      if (existingLfc) {
        throw new ConflictException('This LFC ID is already linked to another account');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phoneNumber:
          dto.phoneNumber === undefined ? undefined : normalizePhoneNumber(dto.phoneNumber),
        favoritePlayer: dto.favoritePlayer,
        avatarUrl: dto.avatarUrl,
        ...(dto.olscId !== undefined ? { olscId: nextOlscId } : {}),
        ...(dto.lfcId !== undefined ? { lfcId: nextLfcId } : {}),
      },
    });

    await this.auditService.log({
      actorUserId: userId,
      action: 'UPDATE_PROFILE',
      entityType: 'USER',
      entityId: userId,
    });

    return {
      message: 'Profile updated successfully.',
      user: {
        id: updated.id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        avatarUrl: updated.avatarUrl,
        phoneNumber: updated.phoneNumber,
        favoritePlayer: updated.favoritePlayer,
        olscId: updated.olscId,
        lfcId: updated.lfcId,
      },
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user?.passwordHash) {
      throw new BadRequestException('This account has no password set yet');
    }

    const currentValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!currentValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must be different from the current password');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.auditService.log({
      actorUserId: userId,
      action: 'CHANGE_PASSWORD',
      entityType: 'USER',
      entityId: userId,
    });

    return {
      message: 'Password changed successfully.',
    };
  }

  async uploadAvatar(userId: string, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Avatar file is required');
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG and WebP images are allowed');
    }

    const avatarUrl = await this.mediaStorageService.uploadAvatar(userId, file);

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    await this.prisma.membershipCard.updateMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      data: { avatarUrl },
    });

    await this.auditService.log({
      actorUserId: userId,
      action: 'UPLOAD_AVATAR',
      entityType: 'USER',
      entityId: userId,
    });

    return {
      message: 'Avatar uploaded successfully.',
      avatarUrl,
    };
  }
}
