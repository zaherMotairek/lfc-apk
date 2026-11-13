import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditListService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: { limit?: number; action?: string; actorUserId?: string }) {
    const limit = Math.min(Math.max(params.limit ?? 100, 1), 500);
    const where = {
      ...(params.action ? { action: params.action } : {}),
      ...(params.actorUserId ? { actorUserId: params.actorUserId } : {}),
    };

    const rows = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        actor: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId,
      metadata: row.metadata,
      createdAt: row.createdAt,
      actor: row.actor,
    }));
  }
}
