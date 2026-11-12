import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('API smoke (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health returns ok', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
      });
  });

  it('GET /api/site-settings/public returns placeholder payment phone', () => {
    return request(app.getHttpServer())
      .get('/api/site-settings/public')
      .expect(200)
      .expect((res) => {
        expect(res.body['payment.payPhone']).toBeDefined();
        expect(String(res.body['payment.payPhone'])).not.toContain('704 292');
      });
  });

  it('POST /api/auth/login rejects invalid credentials', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'nobody-e2e', password: 'wrong-password-xyz' })
      .expect(401);
  });

  it('POST /api/auth/signup rejects short password', () => {
    return request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ username: 'e2euser', password: 'short' })
      .expect(400);
  });
});
