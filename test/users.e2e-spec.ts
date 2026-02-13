import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { seedAdmin } from 'src/seeds/admin.seed';
import { AppDataSource } from 'src/config/db.config';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@admin.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234';

  beforeAll(async () => {
    await seedAdmin();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: adminEmail,
        password: adminPassword,
      })
      .expect(200);

    accessToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  it('GET /users (public)', async () => {
    const res = await request(app.getHttpServer())
      .get('/users?page=1&limit=10')
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('totalPages');
  });

  it('GET /users/me (authorized)', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.email).toBe(adminEmail);
  });

  it('PATCH /users/me (authorized)', async () => {
    const res = await request(app.getHttpServer())
      .patch('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Updated Admin' })
      .expect(200);

    expect(res.body.name).toBe('Updated Admin');
  });

  it('PATCH /users/me/password (authorized)', async () => {
    const res = await request(app.getHttpServer())
      .patch('/users/me/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        oldPassword: adminPassword,
        newPassword: 'newStrongPassword123',
      })
      .expect(200);

    expect(res.body).toEqual({ message: 'Password updated' });
  });
});
