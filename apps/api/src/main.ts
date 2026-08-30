import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { isProduction, requireSecret } from './common/utils/environment';

async function bootstrap() {
  if (isProduction()) {
    requireSecret(process.env.JWT_ACCESS_SECRET, 'JWT_ACCESS_SECRET');
    requireSecret(process.env.JWT_REFRESH_SECRET, 'JWT_REFRESH_SECRET');
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    frameguard: false,
  }));
  app.setGlobalPrefix('api');
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  const appUrl = configService.get<string>('APP_URL') ?? 'http://localhost:5173';
  const extraOrigins = (configService.get<string>('CORS_ORIGINS') ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  app.enableCors({
    origin: [appUrl, ...extraOrigins],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = configService.get<number>('API_PORT') ?? 3000;
  await app.listen(port);
}

bootstrap();
