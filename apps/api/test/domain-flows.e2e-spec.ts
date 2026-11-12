import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Domain flows (e2e characterization)', () => {
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

  it('POST /api/auth/forgot-password accepts unknown email without leaking', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@example.local' });
    expect([200, 201]).toContain(res.status);
  });

  it('POST /api/auth/reset-password rejects invalid token', () => {
    return request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token: 'invalid-token', password: 'NewPassword123!' })
      .expect(400);
  });

  it('POST /api/auth/accept-invitation rejects missing token', () => {
    return request(app.getHttpServer())
      .post('/api/auth/accept-invitation')
      .send({ token: 'bad', password: 'NewPassword123!' })
      .expect(400);
  });

  it('POST /api/membership-applications rejects empty body', () => {
    return request(app.getHttpServer()).post('/api/membership-applications').send({}).expect(400);
  });

  it('GET /api/events returns a list', async () => {
    const res = await request(app.getHttpServer()).get('/api/events');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/leaderboards/overall requires authentication', () => {
    return request(app.getHttpServer()).get('/api/leaderboards/overall').expect(401);
  });

  it('POST /api/membership-cards/verify requires auth and permission', () => {
    return request(app.getHttpServer())
      .post('/api/membership-cards/verify')
      .send({ token: 'demo' })
      .expect(401);
  });
});
