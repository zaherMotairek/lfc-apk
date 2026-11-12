import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

const THROTTLE_MS = 5 * 60 * 1000;

@Injectable()
export class LastSeenInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ user?: { id?: string } }>();
    const userId = request.user?.id;
    if (userId) {
      void this.touchLastSeen(userId);
    }
    return next.handle();
  }

  private async touchLastSeen(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { lastSeenAt: true },
    });
    const now = Date.now();
    if (user?.lastSeenAt && now - user.lastSeenAt.getTime() < THROTTLE_MS) {
      return;
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: new Date(now) },
    });
  }
}
