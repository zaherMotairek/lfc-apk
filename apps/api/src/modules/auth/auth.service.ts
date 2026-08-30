import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtSignOptions, JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  InvitationStatus,
  PlatformAccountStatus,
  RoleCode,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AuditService } from '../../common/services/audit.service';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { MembershipCardsService } from '../members/membership-cards.service';
import { EmailService } from '../../common/services/email.service';
import { isDevTokenExposureAllowed } from '../../common/utils/environment';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly membershipCardsService: MembershipCardsService,
    private readonly emailService: EmailService,
  ) {}

  private normalizeUsername(raw: string) {
    return raw.trim().toLowerCase();
  }

  async signup(dto: SignupDto) {
    const username = this.normalizeUsername(dto.username);
    if (username.length < 3) {
      throw new BadRequestException('Username must be at least 3 characters');
    }

    const existingUsername = await this.prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      throw new ConflictException('This username is already taken');
    }

    // Internal unique email placeholder (no email verification required)
    const email = `${username}@users.olsc.local`;
    const existingEmail = await this.prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      throw new ConflictException('This username is already taken');
    }

    const memberRole = await this.prisma.role.findUnique({ where: { code: RoleCode.MEMBER } });
    if (!memberRole) {
      throw new BadRequestException('MEMBER role is missing. Run database seed first.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        username,
        firstName: '',
        lastName: '',
        email,
        passwordHash,
        platformAccountStatus: PlatformAccountStatus.ACTIVE,
        roles: {
          create: {
            roleId: memberRole.id,
          },
        },
      },
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'SELF_SIGNUP',
      entityType: 'USER',
      entityId: user.id,
      metadata: { username },
    });

    const authUser = await this.usersService.getAuthenticatedUser(user.id);
    const tokens = await this.issueTokens(authUser.id, authUser.email);

    return {
      message: 'Account created. Complete your profile with your name and member details.',
      ...tokens,
      user: {
        id: authUser.id,
        firstName: authUser.firstName,
        lastName: authUser.lastName,
        email: authUser.email,
        username,
        roles: authUser.roles,
        permissions: authUser.permissions,
      },
    };
  }

  async login(dto: LoginDto) {
    const identifier = dto.username.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }],
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.platformAccountStatus !== PlatformAccountStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const authUser = await this.usersService.getAuthenticatedUser(user.id);
    const tokens = await this.issueTokens(authUser.id, authUser.email);

    return {
      ...tokens,
      user: {
        id: authUser.id,
        firstName: authUser.firstName,
        lastName: authUser.lastName,
        email: authUser.email,
        username: user.username,
        roles: authUser.roles,
        permissions: authUser.permissions,
      },
    };
  }

  async acceptInvitation(dto: AcceptInvitationDto) {
    const invitation = await this.prisma.memberInvitation.findUnique({
      where: { token: dto.token },
      include: {
        user: {
          include: {
            memberships: {
              where: { status: 'ACTIVE' },
              take: 1,
            },
          },
        },
      },
    });

    if (!invitation || invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Invitation is invalid');
    }

    if (invitation.expiresAt.getTime() < Date.now()) {
      await this.prisma.memberInvitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED },
      });
      throw new BadRequestException('Invitation has expired');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      await tx.memberInvitation.update({
        where: { id: invitation.id },
        data: {
          status: InvitationStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
      });

      return tx.user.update({
        where: { id: invitation.userId },
        data: {
          passwordHash,
          platformAccountStatus: PlatformAccountStatus.ACTIVE,
        },
        include: {
          memberships: {
            where: { status: 'ACTIVE' },
            take: 1,
          },
        },
      });
    });

    const activeMembership = updatedUser.memberships[0];
    if (activeMembership) {
      await this.membershipCardsService.generateCardForMembership(
        activeMembership.id,
        updatedUser.id,
      );
    }

    await this.auditService.log({
      actorUserId: updatedUser.id,
      action: 'ACCEPT_INVITATION',
      entityType: 'USER',
      entityId: updatedUser.id,
    });

    return {
      message: 'Account activated successfully.',
      userId: updatedUser.id,
    };
  }

  async forgotPassword(dto: { email: string }) {
    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Always return the same message to avoid account enumeration.
    const genericResponse = {
      message: 'If the account exists, a reset link has been generated.',
    };

    if (!user || user.platformAccountStatus !== PlatformAccountStatus.ACTIVE) {
      return genericResponse;
    }

    const token = randomBytes(32).toString('hex');
    const hours = Number(this.configService.get('PASSWORD_RESET_TOKEN_TTL_HOURS') ?? 2);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000),
      },
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'REQUEST_PASSWORD_RESET',
      entityType: 'USER',
      entityId: user.id,
    });

    const appUrl = this.configService.get<string>('APP_URL') ?? 'http://localhost:5173';
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    await this.emailService.sendPasswordResetEmail(user.email, resetLink);

    const response: {
      message: string;
      resetToken?: string;
      resetLink?: string;
      emailSent?: boolean;
    } = {
      ...genericResponse,
      emailSent: this.emailService.isConfigured(),
    };

    if (isDevTokenExposureAllowed() && !this.emailService.isConfigured()) {
      response.resetToken = token;
      response.resetLink = resetLink;
    }

    return response;
  }

  async resetPassword(dto: { token: string; password: string }) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token: dto.token },
    });

    if (!resetToken || resetToken.usedAt) {
      throw new BadRequestException('Reset token is invalid');
    }

    if (resetToken.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Reset token has expired');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      });

      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      });
    });

    await this.auditService.log({
      actorUserId: resetToken.userId,
      action: 'RESET_PASSWORD',
      entityType: 'USER',
      entityId: resetToken.userId,
    });

    return {
      message: 'Password reset successfully.',
    };
  }

  createInvitationToken() {
    return randomBytes(32).toString('hex');
  }

  private async issueTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: (this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ??
        '15m') as JwtSignOptions['expiresIn'],
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ??
        '7d') as JwtSignOptions['expiresIn'],
    });

    return { accessToken, refreshToken };
  }
}
