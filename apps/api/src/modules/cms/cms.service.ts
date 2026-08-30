import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CmsPageCode, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { UpdateCmsPageDto } from './dto/update-cms-page.dto';

@Injectable()
export class CmsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getPublicPage(code: CmsPageCode) {
    const page = await this.prisma.cmsPage.findUnique({
      where: { code },
      include: {
        sections: {
          where: { isEnabled: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!page || !page.isPublished) {
      throw new NotFoundException('Page not found');
    }

    return page;
  }

  async getAdminPage(code: CmsPageCode) {
    const page = await this.prisma.cmsPage.findUnique({
      where: { code },
      include: {
        sections: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    return page;
  }

  async updatePage(code: CmsPageCode, dto: UpdateCmsPageDto, actorUserId: string) {
    const existing = await this.prisma.cmsPage.findUnique({ where: { code } });
    if (!existing) {
      throw new NotFoundException('Page not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.cmsSection.deleteMany({ where: { pageId: existing.id } });

      return tx.cmsPage.update({
        where: { id: existing.id },
        data: {
          title: dto.title ?? existing.title,
          isPublished: dto.isPublished ?? existing.isPublished,
          sections: {
            create: (dto.sections ?? []).map((section, index) => ({
              type: section.type,
              title: section.title,
              subtitle: section.subtitle,
              content: section.content as Prisma.InputJsonValue,
              imageUrl: section.imageUrl,
              sortOrder: section.sortOrder ?? index + 1,
              isEnabled: section.isEnabled ?? true,
            })),
          },
        },
        include: {
          sections: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
    });

    await this.auditService.log({
      actorUserId,
      action: 'UPDATE_CMS_PAGE',
      entityType: 'CMS_PAGE',
      entityId: updated.id,
      metadata: { code },
    });

    return {
      message: 'CMS page updated successfully.',
      page: updated,
    };
  }
}
