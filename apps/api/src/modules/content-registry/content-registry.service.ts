import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CONTENT_REGISTRY,
  contentDefaultForKey,
  contentDefaultsForLanguage,
} from '@kop/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';

@Injectable()
export class ContentRegistryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getBundle(lang = 'en') {
    const language = lang.trim().toLowerCase() || 'en';
    const overrides = await this.prisma.contentOverride.findMany({
      where: { language },
    });

    const values: Record<string, string> = { ...contentDefaultsForLanguage(language) };
    for (const row of overrides) {
      values[row.key] = row.value;
    }
    for (const entry of CONTENT_REGISTRY) {
      if (!values[entry.key]) {
        values[entry.key] = contentDefaultForKey(entry.key, language);
      }
    }

    const version =
      overrides.length === 0
        ? 'defaults'
        : String(
            overrides.reduce((max, row) => Math.max(max, row.updatedAt.getTime()), 0),
          );

    return {
      lang: language,
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
    const language = lang.trim().toLowerCase() || 'en';
    const overrides = await this.prisma.contentOverride.findMany({
      where: { language },
    });
    const map = new Map(overrides.map((row) => [row.key, row]));

    return CONTENT_REGISTRY.map((entry) => {
      const row = map.get(entry.key);
      const baseline = contentDefaultForKey(entry.key, language);
      return {
        ...entry,
        currentValue: row?.value ?? baseline,
        defaultValue: baseline,
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
          valueBefore: existing?.value ?? contentDefaultForKey(params.key, params.language),
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
          valueAfter: contentDefaultForKey(key, language),
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

  async panicRestoreDefaults(params: {
    language: string;
    confirmPhrase: string;
    actorUserId: string;
  }) {
    if (params.confirmPhrase.trim() !== 'RESTORE DEFAULTS') {
      throw new BadRequestException('Type RESTORE DEFAULTS to confirm.');
    }

    const language = params.language.trim().toLowerCase() || 'en';
    const overrides = await this.prisma.contentOverride.findMany({ where: { language } });
    if (!overrides.length) {
      return { message: 'No overrides to remove.', removed: 0 };
    }

    await this.prisma.$transaction([
      ...overrides.map((row) =>
        this.prisma.contentRevision.create({
          data: {
            key: row.key,
            language,
            valueBefore: row.value,
            valueAfter: contentDefaultForKey(row.key, language),
            actorUserId: params.actorUserId,
          },
        }),
      ),
      this.prisma.contentOverride.deleteMany({ where: { language } }),
    ]);

    await this.auditService.log({
      actorUserId: params.actorUserId,
      action: 'PANIC_RESTORE_CONTENT',
      entityType: 'CONTENT',
      entityId: language,
      metadata: { language, removed: overrides.length },
    });

    return {
      message: `All ${overrides.length} text override(s) for “${language}” were reset to defaults.`,
      removed: overrides.length,
    };
  }

  async importLanguageDefaults(language: string, actorUserId: string) {
    const lang = language.trim().toLowerCase() || 'en';
    if (lang !== 'ar') {
      throw new BadRequestException('Only Arabic (ar) preset import is available.');
    }

    let created = 0;
    for (const entry of CONTENT_REGISTRY) {
      const value = contentDefaultForKey(entry.key, lang);
      const existing = await this.prisma.contentOverride.findUnique({
        where: { key_language: { key: entry.key, language: lang } },
      });
      if (existing) continue;

      await this.prisma.contentOverride.create({
        data: {
          key: entry.key,
          language: lang,
          value,
          updatedById: actorUserId,
        },
      });
      await this.prisma.contentRevision.create({
        data: {
          key: entry.key,
          language: lang,
          valueBefore: contentDefaultForKey(entry.key, 'en'),
          valueAfter: value,
          actorUserId,
        },
      });
      created += 1;
    }

    await this.auditService.log({
      actorUserId,
      action: 'IMPORT_CONTENT_LANG_DEFAULTS',
      entityType: 'CONTENT',
      entityId: lang,
      metadata: { created },
    });

    return {
      message:
        created > 0
          ? `Imported ${created} Arabic preset(s). Edit any line in this list.`
          : 'All Arabic keys already have overrides.',
      created,
    };
  }
}
