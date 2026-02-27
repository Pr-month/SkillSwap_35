import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { appConfig } from '../config/app.config';
import { jwtConfig } from '../config/jwt.config';
import { Gender, UserRole } from '../users/enums/user.enums';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { RegisterDto } from './dto/register.dto';
import { TAuthRequest } from './types/auth.types';

const registerDto: RegisterDto = {
  email: 'user@example.com',
  password: 'password123',
  name: 'Anton',
  birthdate: '1995-05-20',
  gender: Gender.MALE,
  city: 1,
  about: 'about me',
};

const loginDto: LoginAuthDto = {
  email: 'user@example.com',
  password: 'password123',
};

const appCfg = { port: 3000, hashSalt: 10 };
const jwtCfg = {
  secret: 'jwt-secret',
  expiresIn: '1h',
  refreshSecret: 'jwt-refresh-secret',
  refreshExpiresIn: '7d',
};

describe('AuthService', () => {
  let service: AuthService;
  let repo: { create: jest.Mock; save: jest.Mock; findOne: jest.Mock, update: jest.Mock; };
  let jwtService: { signAsync: jest.Mock };

  const makeUser = (patch: Partial<User> = {}): User =>
    ({
      id: 'user-id',
      email: registerDto.email,
      password: 'stored-password-hash',
      role: UserRole.USER,
      refreshToken: null,
      ...patch,
    }) as unknown as User;

  const makeRes = () => ({ cookie: jest.fn(), clearCookie: jest.fn() });

  const expectCookies = (
    res: ReturnType<typeof makeRes>,
    accessToken = 'access-token',
    refreshToken = 'refresh-token',
  ) => {
    expect(res.cookie).toHaveBeenCalledWith('accessToken', accessToken, {
      httpOnly: true,
    });
    expect(res.cookie).toHaveBeenCalledWith('refreshToken', refreshToken, {
      httpOnly: true,
    });
  };

  const expectInvalidCredentials = async (promise: Promise<unknown>) => {
    try {
      await promise;
      fail('Expected UnauthorizedException');
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect((error as Error).message).toBe('Invalid credentials');
    }
  };

  beforeEach(async () => {
    repo = { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), update: jest.fn() };
    jwtService = { signAsync: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: jwtService },
        { provide: getRepositoryToken(User), useValue: repo },
        { provide: appConfig.KEY, useValue: appCfg },
        { provide: jwtConfig.KEY, useValue: jwtCfg },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('register success', async () => {
    const res = makeRes();

    repo.create.mockReturnValue(makeUser({ password: 'hashed-password' }));
    repo.save
      .mockResolvedValueOnce(makeUser())
      .mockResolvedValueOnce(
        makeUser({ refreshToken: 'hashed-refresh-token' }),
      );

    jest
      .spyOn(bcrypt, 'hash')
      .mockImplementationOnce(async () => 'hashed-password')
      .mockImplementationOnce(async () => 'hashed-refresh-token');
    jwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    const result = await service.register(
      registerDto,
      res as unknown as Response,
    );

    expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(repo.save).toHaveBeenCalledTimes(2);
    expect(repo.save).toHaveBeenLastCalledWith(
      expect.objectContaining({ refreshToken: 'hashed-refresh-token' }),
    );
    expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    expectCookies(res);
    expect(result).toEqual({ message: 'Registration successful' });
  });

  it('register throws when save fails', async () => {
    repo.create.mockReturnValue(makeUser());
    repo.save.mockRejectedValueOnce(new Error('save failed'));
    jest
      .spyOn(bcrypt, 'hash')
      .mockImplementationOnce(async () => 'hashed-password');

    await expect(
      service.register(registerDto, makeRes() as unknown as Response),
    ).rejects.toThrow('save failed');
  });

  it('login success', async () => {
    const res = makeRes();
    const user = makeUser({ email: loginDto.email });

    repo.findOne.mockResolvedValue(user);
    repo.save.mockResolvedValue(
      makeUser({ refreshToken: 'hashed-refresh-token' }),
    );

    jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
    jest
      .spyOn(bcrypt, 'hash')
      .mockImplementationOnce(async () => 'hashed-refresh-token');
    jwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    const result = await service.login(loginDto, res as unknown as Response);

    expect(repo.findOne).toHaveBeenCalledWith({
      where: { email: loginDto.email },
      select: ['id', 'email', 'password', 'role', 'refreshToken'],
    });
    expect(bcrypt.compare).toHaveBeenCalledWith(
      loginDto.password,
      user.password,
    );
    expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    expect(bcrypt.hash).toHaveBeenCalledWith('refresh-token', appCfg.hashSalt);
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ refreshToken: 'hashed-refresh-token' }),
    );
    expectCookies(res);
    expect(result).toEqual({ message: 'Login successful' });
  });

  it('login throws when user not found', async () => {
    repo.findOne.mockResolvedValue(null);

    await expectInvalidCredentials(
      service.login(loginDto, makeRes() as unknown as Response),
    );
  });

  it('login throws when password is invalid', async () => {
    repo.findOne.mockResolvedValue(makeUser({ email: loginDto.email }));
    jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

    await expectInvalidCredentials(
      service.login(loginDto, makeRes() as unknown as Response),
    );
  });

  it('logout clears cookies', async () => {
    const res = makeRes();
    const result = await service.logout(
      {} as TAuthRequest,
      res as unknown as Response,
    );

    expect(res.clearCookie).toHaveBeenCalledWith('accessToken');
    expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
    expect(result).toEqual({ message: 'Logged out' });
  });

  it('refresh success', async () => {
    const req = {
      user: { sub: 'user-id', email: 'user@example.com', role: UserRole.USER },
    } as TAuthRequest;
    const res = makeRes();

    jwtService.signAsync
      .mockResolvedValueOnce('new-access-token')
      .mockResolvedValueOnce('new-refresh-token');

    jest
      .spyOn(bcrypt, 'hash')
      .mockImplementationOnce(async () => 'hashed-refresh-token');

    repo.update.mockResolvedValue({ affected: 1 });

    const result = await service.refresh(req, res as unknown as Response);

    expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    expect(bcrypt.hash).toHaveBeenCalledWith('new-refresh-token', appCfg.hashSalt);
    expect(repo.update).toHaveBeenCalledWith('user-id', {refreshToken: 'hashed-refresh-token',});
    expectCookies(res, 'new-access-token', 'new-refresh-token');
    expect(result).toEqual({ message: 'Tokens refresh' });
  });
});
