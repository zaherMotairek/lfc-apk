import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { EmailModule } from './common/email/email.module';
import { MediaModule } from './common/media/media.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MembersModule } from './modules/members/members.module';
import { CmsModule } from './modules/cms/cms.module';
import { ContentModule } from './modules/content/content.module';
import { PredictionsModule } from './modules/predictions/predictions.module';
import { CommunityModule } from './modules/community/community.module';
import { SiteSettingsModule } from './modules/site-settings/site-settings.module';
import { ContentRegistryModule } from './modules/content-registry/content-registry.module';
import { BrandModule } from './modules/brand/brand.module';
import { LastSeenInterceptor } from './common/interceptors/last-seen.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ApiRootController } from './api-root.controller';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    EmailModule,
    MediaModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    MembersModule,
    CmsModule,
    ContentModule,
    PredictionsModule,
    CommunityModule,
    SiteSettingsModule,
    ContentRegistryModule,
    BrandModule,
  ],
  controllers: [ApiRootController, HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LastSeenInterceptor,
    },
  ],
})
export class AppModule {}
