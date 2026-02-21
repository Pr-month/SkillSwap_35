import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { Request, RequestStatus } from './entities/request.entity';
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
    if (dto.requestedSkillId === dto.offeredSkillId) {
      throw new ConflictException(
        'requestedSkillId and offeredSkillId must be different',
      );
    }

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

  async findIncoming(userId: string) {
    const requests = await this.requestsRepository.find({
      where: { receiver: { id: userId } },
      relations: ['sender', 'receiver', 'requestedSkill', 'offeredSkill'],
      order: { createdAt: 'DESC' },
    });

    if (!requests.length) {
      throw new NotFoundException('Incoming requests not found');
    }

    return requests;
  }

  async findOutgoing(userId: string) {
    const requests = await this.requestsRepository.find({
      where: { sender: { id: userId } },
      relations: ['sender', 'receiver', 'requestedSkill', 'offeredSkill'],
      order: { createdAt: 'DESC' },
    });

    if (!requests.length) {
      throw new NotFoundException('Outgoing requests not found');
    }

    return requests;
  }

  async updateStatus(
    requestId: string,
    dto: UpdateRequestDto,
    currentUserId: string,
  ) {
    const request = await this.requestsRepository.findOne({
      where: { id: requestId },
      relations: ['sender', 'receiver', 'requestedSkill', 'offeredSkill'],
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.receiver.id !== currentUserId) {
      throw new ForbiddenException('You can update only incoming requests');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new ConflictException('Request status is already updated');
    }

    if (dto.status === RequestStatus.ACCEPTED) {
      await this.requestsRepository.manager.transaction(async (manager) => {
        const transactionalSkillRepository = manager.getRepository(Skill);
        const transactionalRequestRepository = manager.getRepository(Request);

        const senderSkill = transactionalSkillRepository.create({
          title: request.requestedSkill.title,
          description: request.requestedSkill.description,
          category: request.requestedSkill.category,
          images: [...(request.requestedSkill.images ?? [])],
          owner: request.sender,
        });

        const receiverSkill = transactionalSkillRepository.create({
          title: request.offeredSkill.title,
          description: request.offeredSkill.description,
          category: request.offeredSkill.category,
          images: [...(request.offeredSkill.images ?? [])],
          owner: request.receiver,
        });

        await transactionalSkillRepository.save([senderSkill, receiverSkill]);

        request.status = dto.status;
        request.isRead = true;
        await transactionalRequestRepository.save(request);
      });
    } else {
      request.status = dto.status;
      request.isRead = true;
      await this.requestsRepository.save(request);
    }

    const updatedRequest = await this.requestsRepository.findOne({
      where: { id: requestId },
      relations: ['sender', 'receiver', 'requestedSkill', 'offeredSkill'],
    });

    if (!updatedRequest) {
      throw new NotFoundException('Request not found');
    }

    return updatedRequest;
  }

  // Сгенерированные методы — НЕ ТРОГАЕМ
  findAll() {
    return `This action returns all requests`;
  }

  findOne(id: number) {
    return `This action returns a #${id} request`;
  }

  update(id: number) {
    return `This action updates a #${id} request`;
  }

  async removeOutgoing(requestId: string, currentUserId: string) {
    const request = await this.requestsRepository.findOne({
      where: { id: requestId },
      relations: ['sender'],
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.sender.id !== currentUserId) {
      throw new ForbiddenException('You can delete only outgoing requests');
    }

    await this.requestsRepository.remove(request);

    return { message: 'Request deleted' };
  }

  remove(id: number) {
    return `This action removes a #${id} request`;
  }
}
