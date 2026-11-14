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
  const appUrl = configService.get<string>('APP_URL') ?? 'http://localhost:5173';
  const extraOrigins = (configService.get<string>('CORS_ORIGINS') ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const corsOrigins = [appUrl, ...extraOrigins, 'http://localhost:5173', 'http://127.0.0.1:5173'];

  app.setGlobalPrefix('api');
  app.use('/uploads', (req, res, next) => {
    const origin = req.headers.origin;
    if (origin && corsOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
      res.sendStatus(204);
      return;
    }
    next();
  });
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  app.enableCors({
    origin: corsOrigins,
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
