import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MembershipApplicationStatus,
  MembershipPackageType,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { normalizeMemberId, normalizePhoneNumber } from '../../common/utils/member-identity';
import { SubmitMembershipApplicationDto } from './dto/submit-membership-application.dto';
import { UpdateMembershipApplicationDto } from './dto/update-membership-application.dto';

function packageStatusCode(packageType: MembershipPackageType) {
  return packageType === MembershipPackageType.FULL ? 'F' : 'L';
}

function escapeCsv(value: string | number | boolean | null | undefined) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

@Injectable()
export class MembershipApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async submitApplication(dto: SubmitMembershipApplicationDto) {
    if (!dto.paymentAgreed) {
      throw new BadRequestException('Payment agreement is required');
    }

    if (dto.isOfficialLfcMember && !dto.lfcId?.trim()) {
      throw new BadRequestException('LFC Supporter ID is required for official LFC members');
    }

    const application = await this.prisma.membershipApplication.create({
      data: {
        seasonLabel: '2026/27',
        fullName: dto.fullName.trim(),
        email: dto.email.trim().toLowerCase(),
        address: dto.address.trim(),
        phoneNumber: normalizePhoneNumber(dto.phoneNumber) ?? dto.phoneNumber.trim(),
        packageType: dto.packageType,
        previousOlscId: dto.previousOlscId ? normalizeMemberId(dto.previousOlscId) : null,
        isOfficialLfcMember: dto.isOfficialLfcMember,
        lfcId: dto.lfcId ? normalizeMemberId(dto.lfcId) : null,
        paymentAgreed: dto.paymentAgreed,
      },
    });

    return {
      message:
        'Application received. Membership will only be active after payment is confirmed by the committee.',
      id: application.id,
    };
  }

  async listApplications(seasonLabel?: string, status?: MembershipApplicationStatus) {
    const applications = await this.prisma.membershipApplication.findMany({
      where: {
        ...(seasonLabel ? { seasonLabel } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        reviewedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return applications.map((item) => this.toListItem(item));
  }

  async updateApplication(
    id: string,
    dto: UpdateMembershipApplicationDto,
    actorUserId: string,
  ) {
    const existing = await this.prisma.membershipApplication.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Application not found');
    }

    const application = await this.prisma.membershipApplication.update({
      where: { id },
      data: {
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.adminNotes !== undefined ? { adminNotes: dto.adminNotes } : {}),
        ...(dto.assignedOlscId !== undefined
          ? { assignedOlscId: dto.assignedOlscId ? normalizeMemberId(dto.assignedOlscId) : null }
          : {}),
        reviewedById: actorUserId,
        reviewedAt: new Date(),
      },
      include: {
        reviewedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    await this.auditService.log({
      actorUserId,
      action: 'UPDATE_MEMBERSHIP_APPLICATION',
      entityType: 'MEMBERSHIP_APPLICATION',
      entityId: application.id,
      metadata: {
        status: application.status,
        assignedOlscId: application.assignedOlscId,
      },
    });

    return this.toListItem(application);
  }

  async deleteApplication(id: string, actorUserId: string) {
    const existing = await this.prisma.membershipApplication.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Application not found');
    }

    await this.prisma.membershipApplication.delete({ where: { id } });

    await this.auditService.log({
      actorUserId,
      action: 'DELETE_MEMBERSHIP_APPLICATION',
      entityType: 'MEMBERSHIP_APPLICATION',
      entityId: id,
      metadata: {
        fullName: existing.fullName,
        email: existing.email,
      },
    });

    return { message: 'Application deleted.' };
  }

  exportRosterCsv(seasonLabel = '2026/27', status?: MembershipApplicationStatus) {
    return this.buildCsv(seasonLabel, status, 'roster');
  }

  exportFullCsv(seasonLabel = '2026/27', status?: MembershipApplicationStatus) {
    return this.buildCsv(seasonLabel, status, 'full');
  }

  private async buildCsv(
    seasonLabel: string,
    status: MembershipApplicationStatus | undefined,
    mode: 'roster' | 'full',
  ) {
    const applications = await this.prisma.membershipApplication.findMany({
      where: {
        seasonLabel,
        ...(status ? { status } : {}),
      },
      orderBy: [{ assignedOlscId: 'asc' }, { previousOlscId: 'asc' }, { createdAt: 'asc' }],
    });

    if (mode === 'roster') {
      const header = ['OLSC ID', 'ALLRED SUPPORT ID', 'Name', 'Phone Number', 'Status'];
      const rows = applications.map((item) => [
        item.assignedOlscId ?? item.previousOlscId ?? '',
        item.lfcId ?? '',
        item.fullName,
        item.phoneNumber,
        packageStatusCode(item.packageType),
      ]);
      const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
      return {
        filename: `olsc-members-${seasonLabel.replaceAll('/', '-')}.csv`,
        content: `\uFEFF${csv}`,
        count: applications.length,
      };
    }

    const header = [
      'Submitted At',
      'Full Name',
      'Email',
      'Address',
      'Phone Number',
      'Package',
      'Previous OLSC ID',
      'Official LFC Member',
      'ALLRED SUPPORT ID',
      'Application Status',
      'Assigned OLSC ID',
      'Admin Notes',
    ];
    const rows = applications.map((item) => [
      new Date(item.createdAt).toISOString(),
      item.fullName,
      item.email,
      item.address,
      item.phoneNumber,
      item.packageType === MembershipPackageType.FULL ? 'Full ($25)' : 'Light ($10)',
      item.previousOlscId ?? '',
      item.isOfficialLfcMember ? 'Yes' : 'No',
      item.lfcId ?? '',
      item.status,
      item.assignedOlscId ?? '',
      item.adminNotes ?? '',
    ]);
    const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
    return {
      filename: `olsc-applications-${seasonLabel.replaceAll('/', '-')}.csv`,
      content: `\uFEFF${csv}`,
      count: applications.length,
    };
  }

  private toListItem(
    item: Awaited<ReturnType<typeof this.prisma.membershipApplication.findMany>>[number] & {
      reviewedBy?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      } | null;
    },
  ) {
    return {
      id: item.id,
      seasonLabel: item.seasonLabel,
      fullName: item.fullName,
      email: item.email,
      address: item.address,
      phoneNumber: item.phoneNumber,
      packageType: item.packageType,
      previousOlscId: item.previousOlscId,
      isOfficialLfcMember: item.isOfficialLfcMember,
      lfcId: item.lfcId,
      status: item.status,
      assignedOlscId: item.assignedOlscId,
      adminNotes: item.adminNotes,
      createdAt: item.createdAt,
      reviewedAt: item.reviewedAt,
      reviewedBy: item.reviewedBy
        ? {
            id: item.reviewedBy.id,
            name: `${item.reviewedBy.firstName} ${item.reviewedBy.lastName}`.trim(),
            email: item.reviewedBy.email,
          }
        : null,
      rosterStatusCode: packageStatusCode(item.packageType),
      exportOlscId: item.assignedOlscId ?? item.previousOlscId ?? null,
    };
  }
}
