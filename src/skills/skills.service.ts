import {
  ConflictException,
  ForbiddenException,
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
import { UpdateSkillDto } from './dto/update-skill.dto';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillsRepository: Repository<Skill>,
    private readonly usersService: UsersService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>
  ) { }

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

  async update(id: string, updateSkillDto: UpdateSkillDto, userId: string) {
    const skill = await this.skillsRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    if (skill.owner.id !== userId) {
      throw new ForbiddenException('Недостаточно прав для обновления этого навыка');
    }

    Object.assign(skill, updateSkillDto);

    return this.skillsRepository.save(skill);
  }

  async remove(id: string, userId: string) {
    const skill = await this.skillsRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    if (skill.owner.id !== userId) {
      throw new ForbiddenException('Недостаточно прав для удаления этого навыка');
    }

    await this.skillsRepository.remove(skill);

    return { message: 'Skill deleted successfully' };
  }

  async addToFavorites(skillId: string, userId: string) {
    const skill = await this.skillsRepository.findOne({ where: { id: skillId } });
    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.favoriteSkills.includes(skillId)) {
      throw new ConflictException('Навык уже в избранном');
    }

    user.favoriteSkills.push(skillId);

    await this.usersRepository.save(user);

    return { message: 'Skill added to favorites' };
  }

  async removeFromFavorites(skillId: string, userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const index = user.favoriteSkills.indexOf(skillId);

    if (index === -1) {
      throw new NotFoundException('Навык не найден в избранном');
    }

    user.favoriteSkills.splice(index, 1);

    await this.usersRepository.save(user);

    return { message: 'Skill removed from favorites' };
  }
}
