import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: {
    findOneByOrFail: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(async () => {
    usersRepository = {
      findOneByOrFail: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: usersRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('changePassword', () => {
    it('updates password when old password is valid', async () => {
      const user = { id: 'user-id', password: 'hashed' } as User;
      usersRepository.findOneByOrFail.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
      jest.spyOn(bcrypt, 'hash').mockImplementation(async () => 'new-hash');

      const result = await service.changePassword('user-id', {
        oldPassword: 'old-pass',
        newPassword: 'new-pass',
      });

      expect(result).toEqual({ message: 'Password updated' });
      expect(usersRepository.findOneByOrFail).toHaveBeenCalledWith({
        id: 'user-id',
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('old-pass', 'hashed');
      expect(bcrypt.hash).toHaveBeenCalledWith('new-pass', 10);
      expect(usersRepository.update).toHaveBeenCalledWith('user-id', {
        password: 'new-hash',
      });
    });

    it('throws UnauthorizedException when old password is invalid', async () => {
      const user = { id: 'user-id', password: 'hashed' } as User;
      usersRepository.findOneByOrFail.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

      await expect(
        service.changePassword('user-id', {
          oldPassword: 'wrong-pass',
          newPassword: 'new-pass',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(usersRepository.update).not.toHaveBeenCalled();
    });
  });
});
