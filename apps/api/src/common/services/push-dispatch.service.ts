import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PushDispatchService {
  private readonly logger = new Logger(PushDispatchService.name);
  private webPush: typeof import('web-push') | null = null;

  constructor(private readonly prisma: PrismaService) {}

  private async getWebPush() {
    if (this.webPush) return this.webPush;
    const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
    const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
    if (!publicKey || !privateKey) return null;

    const mod = await import('web-push');
    mod.setVapidDetails(
      process.env.VAPID_MAILTO?.trim() || 'mailto:committee@example.local',
      publicKey,
      privateKey,
    );
    this.webPush = mod;
    return mod;
  }

  async sendToUser(userId: string, payload: { title: string; body: string; url?: string }) {
    const wp = await this.getWebPush();
    if (!wp) {
      return { sent: 0, skipped: true, reason: 'VAPID not configured' };
    }

    const subs = await this.prisma.pushSubscription.findMany({ where: { userId } });
    let sent = 0;
    for (const sub of subs) {
      try {
        await wp.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({
            title: payload.title,
            body: payload.body,
            url: payload.url ?? '/app/notifications',
          }),
        );
        sent += 1;
      } catch (err) {
        this.logger.warn(`Push failed for ${sub.id}: ${err instanceof Error ? err.message : err}`);
        if (String(err).includes('410') || String(err).includes('404')) {
          await this.prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => undefined);
        }
      }
    }
    return { sent, skipped: false };
  }
}
