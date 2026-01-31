import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { Repository } from 'typeorm';
import { Skill } from './entities/skill.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillsRepository: Repository<Skill>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}


  create(createSkillDto: CreateSkillDto) {
    return 'This action adds a new skill';
  }

  findAll() {
    return `This action returns all skills`;
  }

  findOne(id: number) {
    return `This action returns a #${id} skill`;
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
