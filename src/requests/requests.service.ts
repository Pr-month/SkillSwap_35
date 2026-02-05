import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRequestDto } from './dto/create-request.dto';
import { Request } from './entities/request.entity';
import { User } from '../users/entities/user.entity';
import { Skill } from '../skills/entities/skill.entity';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(Request)
    private readonly requestsRepository: Repository<Request>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Skill)
    private readonly skillsRepository: Repository<Skill>,
  ) {}

  async create(dto: CreateRequestDto, senderId: string) {
    const sender = await this.usersRepository.findOne({
      where: { id: senderId },
    });

    if (!sender) {
      throw new NotFoundException('Sender not found');
    }

    const requestedSkill = await this.skillsRepository.findOne({
      where: { id: dto.requestedSkillId },
      relations: ['owner'],
    });

    if (!requestedSkill) {
      throw new NotFoundException('Requested skill not found');
    }

    const offeredSkill = await this.skillsRepository.findOne({
      where: { id: dto.offeredSkillId },
    });

    if (!offeredSkill) {
      throw new NotFoundException('Offered skill not found');
    }

    const receiver = requestedSkill.owner;

    const request = this.requestsRepository.create({
      sender,
      receiver,
      requestedSkill,
      offeredSkill,
    });

    return this.requestsRepository.save(request);
  }

  // ✅ ВХОДЯЩИЕ ЗАЯВКИ
  async findIncoming(userId: string) {
    return this.requestsRepository.find({
      where: {
        receiver: {
          id: userId,
        },
      },
      relations: [
        'sender',
        'receiver',
        'requestedSkill',
        'offeredSkill',
      ],
    });
  }

  // ниже НЕ ТРОГАЕМ
  findAll() {
    return `This action returns all requests`;
  }

  findOne(id: number) {
    return `This action returns a #${id} request`;
  }

  update(id: number) {
    return `This action updates a #${id} request`;
  }

  remove(id: number) {
    return `This action removes a #${id} request`;
  }
}
