import { BadRequestException, Injectable } from '@nestjs/common';
import { CONTENT_DEFAULTS_EN, CONTENT_REGISTRY } from '@kop/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';

@Injectable()
export class ContentRegistryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getBundle(lang = 'en') {
    const overrides = await this.prisma.contentOverride.findMany({
      where: { language: lang },
    });
    const map = new Map(overrides.map((row) => [row.key, row.value]));

    const values: Record<string, string> = { ...CONTENT_DEFAULTS_EN };
    for (const row of overrides) {
      values[row.key] = row.value;
    }
    for (const entry of CONTENT_REGISTRY) {
      if (!values[entry.key]) {
        values[entry.key] = entry.defaultEn;
      }
    }

    const version =
      overrides.length === 0
        ? 'defaults'
        : String(
            overrides.reduce((max, row) => Math.max(max, row.updatedAt.getTime()), 0),
          );

    return {
      lang,
      version,
      values,
      registry: CONTENT_REGISTRY,
    };
  }

  listAdmin(lang = 'en') {
    return CONTENT_REGISTRY.map((entry) => ({
      ...entry,
      currentValue: undefined as string | undefined,
      defaultValue: entry.defaultEn,
    }));
  }

  async listAdminWithValues(lang = 'en') {
    const overrides = await this.prisma.contentOverride.findMany({
      where: { language: lang },
    });
    const map = new Map(overrides.map((row) => [row.key, row]));

    return CONTENT_REGISTRY.map((entry) => {
      const row = map.get(entry.key);
      return {
        ...entry,
        currentValue: row?.value ?? entry.defaultEn,
        defaultValue: entry.defaultEn,
        isOverridden: Boolean(row),
        updatedAt: row?.updatedAt ?? null,
      };
    });
  }

  async upsertOverride(params: {
    key: string;
    language: string;
    value: string;
    actorUserId: string;
  }) {
    const entry = CONTENT_REGISTRY.find((item) => item.key === params.key);
    if (!entry) {
      throw new BadRequestException(`Unknown content key: ${params.key}`);
    }
    if (entry.maxLength && params.value.length > entry.maxLength) {
      throw new BadRequestException(`Value exceeds max length (${entry.maxLength})`);
    }

    const existing = await this.prisma.contentOverride.findUnique({
      where: { key_language: { key: params.key, language: params.language } },
    });

    await this.prisma.$transaction([
      this.prisma.contentOverride.upsert({
        where: { key_language: { key: params.key, language: params.language } },
        create: {
          key: params.key,
          language: params.language,
          value: params.value,
          updatedById: params.actorUserId,
        },
        update: {
          value: params.value,
          updatedById: params.actorUserId,
        },
      }),
      this.prisma.contentRevision.create({
        data: {
          key: params.key,
          language: params.language,
          valueBefore: existing?.value ?? entry.defaultEn,
          valueAfter: params.value,
          actorUserId: params.actorUserId,
        },
      }),
    ]);

    await this.auditService.log({
      actorUserId: params.actorUserId,
      action: 'UPDATE_CONTENT_OVERRIDE',
      entityType: 'CONTENT',
      entityId: params.key,
      metadata: { language: params.language },
    });

    return { message: 'Content updated.' };
  }

  async resetOverride(key: string, language: string, actorUserId: string) {
    const existing = await this.prisma.contentOverride.findUnique({
      where: { key_language: { key, language } },
    });
    if (!existing) {
      return { message: 'Already at default.' };
    }

    const entry = CONTENT_REGISTRY.find((item) => item.key === key);

    await this.prisma.$transaction([
      this.prisma.contentOverride.delete({
        where: { key_language: { key, language } },
      }),
      this.prisma.contentRevision.create({
        data: {
          key,
          language,
          valueBefore: existing.value,
          valueAfter: entry?.defaultEn ?? '',
          actorUserId,
        },
      }),
    ]);

    return { message: 'Reset to default.' };
  }

  async listRevisions(key: string, language: string, limit = 12) {
    const entry = CONTENT_REGISTRY.find((item) => item.key === key);
    if (!entry) {
      throw new BadRequestException(`Unknown content key: ${key}`);
    }
    return this.prisma.contentRevision.findMany({
      where: { key, language },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 50),
      select: {
        id: true,
        key: true,
        language: true,
        valueBefore: true,
        valueAfter: true,
        createdAt: true,
        actorUserId: true,
      },
    });
  }

  async rollbackToPrevious(key: string, language: string, actorUserId: string) {
    const latest = await this.prisma.contentRevision.findFirst({
      where: { key, language },
      orderBy: { createdAt: 'desc' },
    });
    if (!latest?.valueBefore) {
      throw new BadRequestException('No revision history to roll back.');
    }
    return this.upsertOverride({
      key,
      language,
      value: latest.valueBefore,
      actorUserId,
    });
  }
}
