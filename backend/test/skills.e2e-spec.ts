import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as cookieParser from 'cookie-parser';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';
import { In, Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Skill } from '../src/skills/entities/skill.entity';
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

type SkillPayload = {
  title: string;
  description: string;
  category: string;
  images: string[];
};

describe('Skills (e2e)', () => {
  let app: INestApplication;
  let skillsRepository: Repository<Skill>;
  let usersRepository: Repository<User>;

  const createdEmails = new Set<string>();
  const createdSkillIds = new Set<string>();

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

  const makeSkillPayload = (prefix: string): SkillPayload => ({
    title: `Skill-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    description: 'Skill description',
    category: 'Programming',
    images: ['image-1.jpg'],
  });

  const makeAccessCookie = (userId: string, email: string): string => {
    const token = jwt.sign(
      { id: userId, sub: userId, email, role: 'USER' },
      process.env.JWT_SECRET ?? 'big_secret',
    );
    return `accessToken=${token}`;
  };

  const registerUser = async (prefix: string) => {
    const agent = request.agent(app.getHttpServer());
    const email = makeEmail(prefix);

    await agent
      .post('/auth/register')
      .send(makeRegisterPayload(email))
      .expect(201);

    createdEmails.add(email);

    const user = await usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new Error(`User not found after register: ${email}`);
    }

    return { agent, user };
  };

  const createSkillAs = async (user: User, prefix: string) => {
    const response = await request(app.getHttpServer())
      .post('/skills')
      .set('Cookie', [makeAccessCookie(user.id, user.email)])
      .send(makeSkillPayload(prefix))
      .expect((res) => expect([200, 201]).toContain(res.status));

    if (response.body?.id) {
      createdSkillIds.add(response.body.id);
    }

    return response;
  };

  const cleanupData = async () => {
    if (createdSkillIds.size > 0) {
      await skillsRepository.delete({ id: In(Array.from(createdSkillIds)) });
      createdSkillIds.clear();
    }

    if (createdEmails.size > 0) {
      await usersRepository.delete({ email: In(Array.from(createdEmails)) });
      createdEmails.clear();
    }
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();

    skillsRepository = app.get<Repository<Skill>>(getRepositoryToken(Skill));
    usersRepository = app.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(async () => {
    await cleanupData();
  });

  afterAll(async () => {
    await cleanupData();
    await app.close();
  });

  it('GET /skills without auth -> 200 and pagination structure', async () => {
    const response = await request(app.getHttpServer())
      .get('/skills')
      .query({ page: 1, limit: 20 })
      .expect(200);

    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('page');
    expect(response.body).toHaveProperty('totalPages');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('POST /skills without access cookie -> 401', async () => {
    await request(app.getHttpServer())
      .post('/skills')
      .send(makeSkillPayload('no-auth'))
      .expect(401);
  });

  it('POST /skills with access cookie -> success', async () => {
    const { agent } = await registerUser('create');
    const payload = makeSkillPayload('create');

    const response = await agent
      .post('/skills')
      .send(payload)
      .expect((res) => expect([200, 201]).toContain(res.status));

    expect(response.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        title: payload.title,
        description: payload.description,
        category: payload.category,
      }),
    );

    createdSkillIds.add(response.body.id);
  });

  it('PATCH /skills/:id by owner -> success', async () => {
    const { user } = await registerUser('patch-owner');
    const created = await createSkillAs(user, 'patch-owner');
    const updateDto = { title: `Updated-${Date.now()}` };

    const response = await request(app.getHttpServer())
      .patch(`/skills/${created.body.id}`)
      .set('Cookie', [makeAccessCookie(user.id, user.email)])
      .send(updateDto)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: created.body.id,
        title: updateDto.title,
      }),
    );
  });

  it('PATCH /skills/:id by non-owner -> 403', async () => {
    const { user: owner } = await registerUser('patch-owner-403');
    const { user: stranger } = await registerUser('patch-stranger-403');
    const created = await createSkillAs(owner, 'patch-403');

    await request(app.getHttpServer())
      .patch(`/skills/${created.body.id}`)
      .set('Cookie', [makeAccessCookie(stranger.id, stranger.email)])
      .send({ title: 'Hacked title' })
      .expect(403);
  });

  it('DELETE /skills/:id by owner -> success', async () => {
    const { user } = await registerUser('delete-owner');
    const created = await createSkillAs(user, 'delete-owner');

    const response = await request(app.getHttpServer())
      .delete(`/skills/${created.body.id}`)
      .set('Cookie', [makeAccessCookie(user.id, user.email)])
      .expect(200);

    expect(response.body).toEqual({ message: 'Skill deleted successfully' });
    createdSkillIds.delete(created.body.id);
  });

  it('DELETE /skills/:id by non-owner -> 403', async () => {
    const { user: owner } = await registerUser('delete-owner-403');
    const { user: stranger } = await registerUser('delete-stranger-403');
    const created = await createSkillAs(owner, 'delete-403');

    await request(app.getHttpServer())
      .delete(`/skills/${created.body.id}`)
      .set('Cookie', [makeAccessCookie(stranger.id, stranger.email)])
      .expect(403);
  });
});
