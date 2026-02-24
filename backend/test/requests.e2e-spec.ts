import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as cookieParser from 'cookie-parser';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';
import { In, Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { User } from '../src/users/entities/user.entity';
import { Skill } from '../src/skills/entities/skill.entity';
import {
  Request as SkillRequest,
  RequestStatus,
} from '../src/requests/entities/request.entity';

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

type CreateRequestPayload = {
  requestedSkillId: string;
  offeredSkillId: string;
};

describe('Requests (e2e)', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;
  let skillsRepository: Repository<Skill>;
  let requestsRepository: Repository<SkillRequest>;

  const createdEmails = new Set<string>();
  const createdSkills = new Set<string>();
  const createdRequests = new Set<string>();

  const makeEmail = (prefix: string) =>
    `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@e2e.local`;

  const makeRegisterPayload = (email: string): RegisterPayload => ({
    email,
    password: 'Password123!',
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
    if (!user) throw new Error('User not found after register');

    return { agent, user };
  };

  const createSkillAs = async (user: User, prefix: string) => {
    const payload = makeSkillPayload(prefix);
    const response = await request(app.getHttpServer())
      .post('/skills')
      .set('Cookie', [makeAccessCookie(user.id, user.email)])
      .send(payload)
      .expect((res) => expect([200, 201]).toContain(res.status));

    createdSkills.add(response.body.id);
    return response.body;
  };

  const createRequestAs = async (
    sender: User,
    offeredSkill: Skill,
    requestedSkill: Skill,
  ) => {
    const payload: CreateRequestPayload = {
      requestedSkillId: requestedSkill.id,
      offeredSkillId: offeredSkill.id,
    };

    const response = await request(app.getHttpServer())
      .post('/requests')
      .set('Cookie', [makeAccessCookie(sender.id, sender.email)])
      .send(payload)
      .expect(201);

    createdRequests.add(response.body.id);
    return response.body;
  };

  const cleanup = async () => {
    if (createdRequests.size > 0) {
      await requestsRepository.delete({ id: In(Array.from(createdRequests)) });
      createdRequests.clear();
    }
    if (createdSkills.size > 0) {
      await skillsRepository.delete({ id: In(Array.from(createdSkills)) });
      createdSkills.clear();
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

    usersRepository = app.get<Repository<User>>(getRepositoryToken(User));
    skillsRepository = app.get<Repository<Skill>>(getRepositoryToken(Skill));
    requestsRepository = app.get<Repository<SkillRequest>>(
      getRepositoryToken(SkillRequest),
    );
  });

  afterEach(async () => cleanup());
  afterAll(async () => cleanup().then(() => app.close()));

  it('POST /requests without auth -> 401', async () => {
    await request(app.getHttpServer())
      .post('/requests')
      .send({ requestedSkillId: 'x', offeredSkillId: 'y' })
      .expect(401);
  });

  it('POST /requests with auth -> 201', async () => {
    const { user: sender } = await registerUser('sender');
    const { user: receiver } = await registerUser('receiver');
    const senderSkill = await createSkillAs(sender, 'sender');
    const requestedSkill = await createSkillAs(receiver, 'receiver');

    const requestBody = {
      requestedSkillId: requestedSkill.id,
      offeredSkillId: senderSkill.id,
    };

    const response = await request(app.getHttpServer())
      .post('/requests')
      .set('Cookie', [makeAccessCookie(sender.id, sender.email)])
      .send(requestBody)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    createdRequests.add(response.body.id);
  });

  it('GET /requests/incoming & /outgoing', async () => {
    const { user: sender } = await registerUser('sender2');
    const { user: receiver } = await registerUser('receiver2');
    const senderSkill = await createSkillAs(sender, 'sender2');
    const requestedSkill = await createSkillAs(receiver, 'receiver2');
    const requestEntity = await createRequestAs(
      sender,
      senderSkill,
      requestedSkill,
    );

    // Incoming for receiver
    const incoming = await request(app.getHttpServer())
      .get('/requests/incoming')
      .set('Cookie', [makeAccessCookie(receiver.id, receiver.email)])
      .expect(200);

    expect(incoming.body[0].id).toBe(requestEntity.id);

    // Outgoing for sender
    const outgoing = await request(app.getHttpServer())
      .get('/requests/outgoing')
      .set('Cookie', [makeAccessCookie(sender.id, sender.email)])
      .expect(200);

    expect(outgoing.body[0].id).toBe(requestEntity.id);
  });

  it('PATCH /requests/:id by non-receiver -> 403', async () => {
    const { user: sender } = await registerUser('sender3');
    const { user: receiver } = await registerUser('receiver3');
    const senderSkill = await createSkillAs(sender, 'sender3');
    const requestedSkill = await createSkillAs(receiver, 'receiver3');
    const requestEntity = await createRequestAs(
      sender,
      senderSkill,
      requestedSkill,
    );

    await request(app.getHttpServer())
      .patch(`/requests/${requestEntity.id}`)
      .set('Cookie', [makeAccessCookie(sender.id, sender.email)])
      .send({ status: RequestStatus.ACCEPTED })
      .expect(403);
  });

  it('PATCH /requests/:id accept -> success', async () => {
    const { user: sender } = await registerUser('sender4');
    const { user: receiver } = await registerUser('receiver4');
    const senderSkill = await createSkillAs(sender, 'sender4');
    const requestedSkill = await createSkillAs(receiver, 'receiver4');
    const requestEntity = await createRequestAs(
      sender,
      senderSkill,
      requestedSkill,
    );

    const response = await request(app.getHttpServer())
      .patch(`/requests/${requestEntity.id}`)
      .set('Cookie', [makeAccessCookie(receiver.id, receiver.email)])
      .send({ status: RequestStatus.ACCEPTED })
      .expect(200);

    expect(response.body.status).toBe(RequestStatus.ACCEPTED);
    expect(response.body.isRead).toBe(true);
  });

  it('DELETE /requests/:id by sender -> success', async () => {
    const { user: sender } = await registerUser('sender5');
    const { user: receiver } = await registerUser('receiver5');
    const senderSkill = await createSkillAs(sender, 'sender5');
    const requestedSkill = await createSkillAs(receiver, 'receiver5');
    const requestEntity = await createRequestAs(
      sender,
      senderSkill,
      requestedSkill,
    );

    await request(app.getHttpServer())
      .delete(`/requests/${requestEntity.id}`)
      .set('Cookie', [makeAccessCookie(sender.id, sender.email)])
      .expect(200);
  });
});
