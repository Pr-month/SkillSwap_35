import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { SkillPaginatedDto } from './dto/skill-paginated.dto';
import { SkillQueryDto } from './dto/skill-query.dto';
import { SkillDto } from './dto/skill.dto';
import { Skill } from './entities/skill.entity';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillsRepository: Repository<Skill>,
    private readonly usersService: UsersService,
  ) {}

  async create(
    createSkillDto: CreateSkillDto,
    userId: string,
  ): Promise<SkillDto> {
    const user = await this.usersService.findOne(userId);

    if (!user) {
      throw new NotFoundException(`Пользователь с ID ${userId} не найден`);
    }

    const existingSkill = await this.skillsRepository.findOne({
      where: {
        title: createSkillDto.title,
        owner: { id: userId },
      },
    });

    if (existingSkill) {
      throw new ConflictException(
        `Навык "${createSkillDto.title}" уже существует`,
      );
    }

    const skill = this.skillsRepository.create({
      ...createSkillDto,
      owner: user,
    });

    const savedSkill = await this.skillsRepository.save(skill);

    const result = plainToInstance(SkillDto, savedSkill, {
      excludeExtraneousValues: true,
    });

    return result;
  }

  async findAll(query: SkillQueryDto): Promise<SkillPaginatedDto> {
    const { page, limit, search, category } = query;

    const skip = (page - 1) * limit;

    const queryBuilder = this.skillsRepository
      .createQueryBuilder('skill')
      .leftJoinAndSelect('skill.owner', 'owner')
      .select([
        'skill',
        'owner.id',
        'owner.name',
        'owner.avatar',
        'owner.city',
      ]);

    if (search) {
      // TODO: Когда появится сущность Category, обновить поиск:
      // Должен искать по: skill.title И (category.name ИЛИ parent.name)
      // Сейчас: ищет только по skill.title и skill.category (строке)
      queryBuilder.andWhere(
        '(LOWER(skill.title) LIKE LOWER(:search) OR LOWER(skill.category) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    if (category) {
      // TODO: Когда появится сущность Category, обновить фильтр:
      // Должен фильтровать по: category.name = :category ИЛИ parent.name = :category
      // Сейчас: фильтрует только по skill.category (строке)
      queryBuilder.andWhere('LOWER(skill.category) = LOWER(:category)', {
        category,
      });
    }

    // TODO: Когда появится сущность Category, добавить:
    // .leftJoinAndSelect('skill.category', 'category')
    // .leftJoinAndSelect('category.parent', 'parent')
    // В select добавить: 'category', 'parent'

    queryBuilder.skip(skip).take(limit);

    const [skills, totalItems] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(totalItems / limit);
    if (page > totalPages && totalPages > 0) {
      throw new NotFoundException(
        `Страница ${page} не существует. Всего страниц: ${totalPages}`,
      );
    }

    const skillsDto = plainToInstance(SkillDto, skills, {
      excludeExtraneousValues: true,
    });

    const paginatedData = {
      data: skillsDto,
      page,
      totalPages,
    };

    return plainToInstance(SkillPaginatedDto, paginatedData, {
      excludeExtraneousValues: true,
    });
  }

  // findOne(id: number) {
  //   return `This action returns a #${id} skill`;
  // }

  // update(id: number, updateSkillDto: UpdateSkillDto) {
  //   return `This action updates a #${id} skill`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} skill`;
  // }
}
