import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as cookieParser from 'cookie-parser';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';
import { Repository, In } from 'typeorm';
import { AppModule } from '../src/app.module';
import { User } from '../src/users/entities/user.entity';

type RegisterPayload = {
  email: string;
  password: string;
  name: string;
  birthdate: string;
  gender: string;
  city: string;
  about: string;
};

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;
  const createdEmails = new Set<string>();

  const makeEmail = (prefix: string) =>
    `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@e2e.local`;

  const makeRegisterPayload = (
    email: string,
    password = 'Password123!',
  ): RegisterPayload => ({
    email,
    password,
    name: 'Anton',
    birthdate: '1995-05-20',
    gender: 'MALE',
    city: 'Kyiv',
    about: 'about me',
  });

  const extractSetCookie = (res: request.Response): string[] => {
    const rawHeader = res.headers['set-cookie'];

    if (!rawHeader) {
      return [];
    }

    return Array.isArray(rawHeader) ? rawHeader : [rawHeader];
  };

  const expectAuthCookies = (setCookie: string[]) => {
    const accessCookie = setCookie.find((cookie) =>
      cookie.startsWith('accessToken='),
    );
    const refreshCookie = setCookie.find((cookie) =>
      cookie.startsWith('refreshToken='),
    );

    expect(accessCookie).toBeDefined();
    expect(refreshCookie).toBeDefined();
    expect(accessCookie).toContain('HttpOnly');
    expect(refreshCookie).toContain('HttpOnly');
  };

  const cleanupCreatedUsers = async () => {
    if (createdEmails.size === 0) {
      return;
    }
    await usersRepository.delete({ email: In(Array.from(createdEmails)) });
    createdEmails.clear();
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();

    usersRepository = app.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(async () => {
    await cleanupCreatedUsers();
  });

  afterAll(async () => {
    await cleanupCreatedUsers();
    await app.close();
  });

  it('POST /auth/register -> 201, message and auth cookies', async () => {
    const email = makeEmail('register');
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(makeRegisterPayload(email))
      .expect(201);

    createdEmails.add(email);

    expect(response.body).toEqual({ message: 'Registration successful' });
    expectAuthCookies(extractSetCookie(response));
  });

  it('POST /auth/login -> success, message and auth cookies', async () => {
    const email = makeEmail('login');
    const password = 'Password123!';

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(makeRegisterPayload(email, password))
      .expect(201);
    createdEmails.add(email);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    expect(response.body).toEqual({ message: 'Login successful' });
    expectAuthCookies(extractSetCookie(response));
  });

  it('POST /auth/refresh without refresh cookie -> 401', async () => {
    await request(app.getHttpServer()).post('/auth/refresh').expect(401);
  });

  it('POST /auth/refresh with refresh cookie -> success and new cookies', async () => {
    const agent = request.agent(app.getHttpServer());
    const refreshToken = jwt.sign(
      {
        sub: 'user-1',
        email: makeEmail('refresh'),
        role: 'USER',
      },
      process.env.JWT_REFRESH_SECRET ??
        process.env.JWT_SECRET ??
        'big_refresh_secret',
    );

    const response = await agent
      .post('/auth/refresh')
      .set('Cookie', [`refreshToken=${refreshToken}`])
      .expect(201);

    expect(response.body).toEqual({ message: 'Tokens refresh' });
    expectAuthCookies(extractSetCookie(response));
  });

  it('POST /auth/logout without access cookie -> 401', async () => {
    await request(app.getHttpServer()).post('/auth/logout').expect(401);
  });

  it('POST /auth/logout with access cookie -> success and clear cookies', async () => {
    const email = makeEmail('logout');
    const password = 'Password123!';
    const agent = request.agent(app.getHttpServer());

    await agent.post('/auth/register').send(makeRegisterPayload(email, password)).expect(201);
    createdEmails.add(email);

    const response = await agent.post('/auth/logout').expect(201);
    const setCookie = extractSetCookie(response);

    expect(response.body).toEqual({ message: 'Logged out' });
    expect(setCookie.some((cookie) => cookie.startsWith('accessToken=;'))).toBe(
      true,
    );
    expect(
      setCookie.some((cookie) => cookie.startsWith('refreshToken=;')),
    ).toBe(true);
  });

  it('POST /auth/login with wrong password -> 401', async () => {
    const email = makeEmail('wrong-pass');

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(makeRegisterPayload(email, 'Password123!'))
      .expect(201);
    createdEmails.add(email);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'WrongPassword123!' })
      .expect(401);

    expect(response.body.message).toBe('Invalid credentials');
  });

  it('POST /auth/login with non-existing email -> 401', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: makeEmail('missing'), password: 'Password123!' })
      .expect(401);

    expect(response.body.message).toBe('Invalid credentials');
  });
});
