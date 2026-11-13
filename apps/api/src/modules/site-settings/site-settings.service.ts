import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import {
  PUBLIC_SITE_SETTING_KEYS,
  SITE_SETTING_DEFAULTS,
  type SiteSettingKey,
} from './site-settings.constants';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';

@Injectable()
export class SiteSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getPublicSettings(): Promise<Record<string, string>> {
    const rows = await this.prisma.siteSetting.findMany({
      where: { key: { in: [...PUBLIC_SITE_SETTING_KEYS] } },
    });
    const map = new Map(rows.map((row) => [row.key, row.value]));

    const out: Record<string, string> = {};
    for (const key of PUBLIC_SITE_SETTING_KEYS) {
      out[key] = map.get(key) ?? SITE_SETTING_DEFAULTS[key].value;
    }
    return out;
  }

  async listAll() {
    const rows = await this.prisma.siteSetting.findMany({ orderBy: { key: 'asc' } });
    const known = new Set(PUBLIC_SITE_SETTING_KEYS);

    const standard = PUBLIC_SITE_SETTING_KEYS.map((key) => {
      const row = rows.find((r) => r.key === key);
      const defaults = SITE_SETTING_DEFAULTS[key];
      return {
        key,
        value: row?.value ?? defaults.value,
        defaultValue: defaults.value,
        description: row?.description ?? defaults.description,
        isOverridden: Boolean(row),
        updatedAt: row?.updatedAt ?? null,
      };
    });

    const extra = rows
      .filter((r) => !known.has(r.key as SiteSettingKey))
      .map((r) => ({
        key: r.key,
        value: r.value,
        defaultValue: '',
        description: r.description ?? '',
        isOverridden: true,
        updatedAt: r.updatedAt,
      }));

    return [...standard, ...extra];
  }

  async updateSettings(dto: UpdateSiteSettingsDto, actorUserId: string) {
    for (const entry of dto.settings) {
      const known = PUBLIC_SITE_SETTING_KEYS.includes(entry.key as SiteSettingKey);
      const description = known
        ? SITE_SETTING_DEFAULTS[entry.key as SiteSettingKey].description
        : entry.description;

      await this.prisma.siteSetting.upsert({
        where: { key: entry.key },
        create: {
          key: entry.key,
          value: entry.value,
          description,
          updatedById: actorUserId,
        },
        update: {
          value: entry.value,
          description,
          updatedById: actorUserId,
        },
      });
    }

    const brandTouched = dto.settings.some((entry) => entry.key.startsWith('brand.'));
    if (brandTouched) {
      const versionRow = await this.prisma.siteSetting.findUnique({
        where: { key: 'brand.version' },
      });
      const current = Number(versionRow?.value ?? '1');
      const nextVersion = Number.isFinite(current) ? String(current + 1) : String(Date.now());
      await this.prisma.siteSetting.upsert({
        where: { key: 'brand.version' },
        create: {
          key: 'brand.version',
          value: nextVersion,
          description: 'Brand asset version.',
          updatedById: actorUserId,
        },
        update: { value: nextVersion, updatedById: actorUserId },
      });
    }

    await this.auditService.log({
      actorUserId,
      action: 'UPDATE_SITE_SETTINGS',
      entityType: 'SITE_SETTINGS',
      metadata: { keys: dto.settings.map((s) => s.key) },
    });

    return { message: 'Site settings saved.' };
  }

  async seedDefaults() {
    for (const key of PUBLIC_SITE_SETTING_KEYS) {
      const defaults = SITE_SETTING_DEFAULTS[key];
      await this.prisma.siteSetting.upsert({
        where: { key },
        create: {
          key,
          value: defaults.value,
          description: defaults.description,
        },
        update: {},
      });
    }
  }
}
