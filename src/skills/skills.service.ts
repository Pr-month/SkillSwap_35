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

  // findAll() {
  //   return `This action returns all skills`;
  // }

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
