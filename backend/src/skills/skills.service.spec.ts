jest.mock(
  'src/users/entities/user.entity',
  () => ({
    User: class User {},
  }),
  { virtual: true },
);

import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from '../users/users.service';
import { SkillsService } from './skills.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { SkillQueryDto } from './dto/skill-query.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { Skill } from './entities/skill.entity';

type SkillsRepoMock = {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  remove: jest.Mock;
  createQueryBuilder: jest.Mock;
};

type UsersRepoMock = {
  findOne: jest.Mock;
  save: jest.Mock;
};

type QueryBuilderMock = {
  leftJoinAndSelect: jest.Mock;
  select: jest.Mock;
  andWhere: jest.Mock;
  skip: jest.Mock;
  take: jest.Mock;
  getManyAndCount: jest.Mock;
};

const createSkillDto: CreateSkillDto = {
  title: 'JavaScript',
  description: 'Language for web',
  category: 'Programming',
  images: ['img-1.jpg'],
};

const makeSkill = (patch: Partial<Skill> = {}): Skill =>
  ({
    id: 'skill-1',
    title: 'JavaScript',
    description: 'Language for web',
    category: 'Programming',
    images: ['img-1.jpg'],
    owner: {
      id: 'user-1',
      name: 'Anton',
      avatar: null,
      city: 'Kyiv',
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-02'),
    ...patch,
  }) as unknown as Skill;

const makeUser = (favoriteSkills: Array<{ id: string }> = []) =>
  ({
    id: 'user-1',
    favoriteSkills,
  }) as any;

const createQueryBuilderMock = (): QueryBuilderMock => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
});

describe('SkillsService', () => {
  let service: SkillsService;
  let skillsRepo: SkillsRepoMock;
  let usersRepo: UsersRepoMock;
  let usersService: { findOne: jest.Mock };
  let queryBuilder: QueryBuilderMock;

  beforeEach(async () => {
    queryBuilder = createQueryBuilderMock();

    skillsRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    usersRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    usersService = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillsService,
        { provide: getRepositoryToken(Skill), useValue: skillsRepo },
        { provide: UsersService, useValue: usersService },
        { provide: 'UserRepository', useValue: usersRepo },
      ],
    }).compile();

    service = module.get<SkillsService>(SkillsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('throws NotFoundException when user not found', async () => {
      usersService.findOne.mockResolvedValue(null);

      await expect(
        service.create(createSkillDto, 'user-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ConflictException when skill already exists for user', async () => {
      usersService.findOne.mockResolvedValue({ id: 'user-1' });
      skillsRepo.findOne.mockResolvedValue(makeSkill());

      await expect(
        service.create(createSkillDto, 'user-1'),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates and saves skill successfully', async () => {
      const user = { id: 'user-1' };
      const createdSkill = makeSkill({ owner: user as any });
      const savedSkill = makeSkill({ owner: user as any });

      usersService.findOne.mockResolvedValue(user);
      skillsRepo.findOne.mockResolvedValue(null);
      skillsRepo.create.mockReturnValue(createdSkill);
      skillsRepo.save.mockResolvedValue(savedSkill);

      const result = await service.create(createSkillDto, 'user-1');

      expect(skillsRepo.create).toHaveBeenCalledWith({
        ...createSkillDto,
        owner: user,
      });
      expect(skillsRepo.save).toHaveBeenCalledWith(createdSkill);
      expect(result).toMatchObject({
        id: savedSkill.id,
        title: savedSkill.title,
        description: savedSkill.description,
        category: savedSkill.category,
      });
    });
  });

  describe('findAll', () => {
    it('returns paginated data and calls querybuilder chain', async () => {
      const query: SkillQueryDto = {
        page: 2,
        limit: 2,
        search: 'java',
        category: 'Programming',
      };
      const skills = [makeSkill()];

      queryBuilder.getManyAndCount.mockResolvedValue([skills, 5]);

      const result = await service.findAll(query);

      expect(skillsRepo.createQueryBuilder).toHaveBeenCalledWith('skill');
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        '(LOWER(skill.title) LIKE LOWER(:search) OR LOWER(skill.category) LIKE LOWER(:search))',
        { search: '%java%' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'LOWER(skill.category) = LOWER(:category)',
        { category: 'Programming' },
      );
      expect(queryBuilder.skip).toHaveBeenCalledWith(2);
      expect(queryBuilder.take).toHaveBeenCalledWith(2);
      expect(queryBuilder.getManyAndCount).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({
        page: 2,
        totalPages: 3,
      });
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        id: skills[0].id,
        title: skills[0].title,
      });
    });

    it('throws NotFoundException when page exceeds total pages', async () => {
      const query: SkillQueryDto = {
        page: 3,
        limit: 10,
        search: '',
        category: '',
      };

      queryBuilder.getManyAndCount.mockResolvedValue([[], 15]);

      await expect(service.findAll(query)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException when skill not found', async () => {
      skillsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('skill-1', { title: 'TypeScript' }, 'user-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ForbiddenException when user is not owner', async () => {
      skillsRepo.findOne.mockResolvedValue(
        makeSkill({ owner: { id: 'user-2' } as any }),
      );

      await expect(
        service.update('skill-1', { title: 'TypeScript' }, 'user-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('updates skill successfully', async () => {
      const skill = makeSkill({ owner: { id: 'user-1' } as any });
      const dto: UpdateSkillDto = { title: 'TypeScript' };

      skillsRepo.findOne.mockResolvedValue(skill);
      skillsRepo.save.mockImplementation(async (entity) => entity);

      const result = await service.update('skill-1', dto, 'user-1');

      expect(skillsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'skill-1', title: 'TypeScript' }),
      );
      expect(result).toMatchObject({ id: 'skill-1', title: 'TypeScript' });
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when skill not found', async () => {
      skillsRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('skill-1', 'user-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when user is not owner', async () => {
      skillsRepo.findOne.mockResolvedValue(
        makeSkill({ owner: { id: 'user-2' } as any }),
      );

      await expect(service.remove('skill-1', 'user-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('removes skill successfully', async () => {
      const skill = makeSkill({ owner: { id: 'user-1' } as any });
      skillsRepo.findOne.mockResolvedValue(skill);
      skillsRepo.remove.mockResolvedValue(skill);

      const result = await service.remove('skill-1', 'user-1');

      expect(skillsRepo.remove).toHaveBeenCalledWith(skill);
      expect(result).toEqual({ message: 'Skill deleted successfully' });
    });
  });

  describe('addToFavorites', () => {
    it('throws NotFoundException when skill not found', async () => {
      skillsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.addToFavorites('skill-1', 'user-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFoundException when user not found', async () => {
      skillsRepo.findOne.mockResolvedValue(makeSkill());
      usersRepo.findOne.mockResolvedValue(null);

      await expect(
        service.addToFavorites('skill-1', 'user-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ConflictException when skill already in favorites', async () => {
      const skill = makeSkill({ id: 'skill-1' });
      skillsRepo.findOne.mockResolvedValue(skill);
      usersRepo.findOne.mockResolvedValue(makeUser([{ id: 'skill-1' }]));

      await expect(
        service.addToFavorites('skill-1', 'user-1'),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('adds skill to favorites successfully', async () => {
      const skill = makeSkill({ id: 'skill-1' });
      const user = makeUser([]);

      skillsRepo.findOne.mockResolvedValue(skill);
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockResolvedValue(user);

      const result = await service.addToFavorites('skill-1', 'user-1');

      expect(user.favoriteSkills).toHaveLength(1);
      expect(user.favoriteSkills[0]).toBe(skill);
      expect(usersRepo.save).toHaveBeenCalledWith(user);
      expect(result).toEqual({ message: 'Skill added to favorites' });
    });
  });

  describe('removeFromFavorites', () => {
    it('throws NotFoundException when user not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);

      await expect(
        service.removeFromFavorites('skill-1', 'user-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFoundException when skill not in favorites', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser([{ id: 'skill-2' }]));

      await expect(
        service.removeFromFavorites('skill-1', 'user-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('removes skill from favorites successfully', async () => {
      const user = makeUser([{ id: 'skill-1' }, { id: 'skill-2' }]);
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockResolvedValue(user);

      const result = await service.removeFromFavorites('skill-1', 'user-1');

      expect(user.favoriteSkills).toEqual([{ id: 'skill-2' }]);
      expect(usersRepo.save).toHaveBeenCalledWith(user);
      expect(result).toEqual({ message: 'Skill removed from favorites' });
    });
  });
});
