import { Test, TestingModule } from '@nestjs/testing';
import { RequestsService } from './requests.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { Request, RequestStatus } from './entities/request.entity';
import { User } from '../users/entities/user.entity';
import { Skill } from '../skills/entities/skill.entity';
import { NotificationGateway } from '../notifications/notifications.gateway';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';

describe('RequestsService', () => {
  let service: RequestsService;
  let requestsRepository: any;
  let usersRepository: any;
  let skillsRepository: any;
  let notificationGateway: any;

  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    avatar: 'avatar.jpg',
  };

  const mockReceiver = {
    id: 'user-2',
    name: 'Receiver User',
    avatar: 'avatar2.jpg',
  };

  const mockRequestedSkill = {
    id: 'skill-1',
    title: 'Requested Skill',
    description: 'Description',
    category: 'Category',
    images: [],
    owner: mockReceiver,
  };

  const mockOfferedSkill = {
    id: 'skill-2',
    title: 'Offered Skill',
    description: 'Description',
    category: 'Category',
    images: [],
    owner: mockUser,
  };

  const mockRequest = {
    id: 'request-1',
    status: RequestStatus.PENDING,
    isRead: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    sender: mockUser,
    receiver: mockReceiver,
    requestedSkill: mockRequestedSkill,
    offeredSkill: mockOfferedSkill,
  };

  beforeEach(async () => {
    requestsRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      manager: {
        transaction: jest.fn(),
      },
    };

    usersRepository = {
      findOne: jest.fn(),
    };

    skillsRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    notificationGateway = {
      notifyUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        {
          provide: getRepositoryToken(Request),
          useValue: requestsRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository,
        },
        {
          provide: getRepositoryToken(Skill),
          useValue: skillsRepository,
        },
        {
          provide: NotificationGateway,
          useValue: notificationGateway,
        },
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto: CreateRequestDto = {
      requestedSkillId: 'skill-1',
      offeredSkillId: 'skill-2',
    };

    it('должен создать запрос', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser);
      skillsRepository.findOne
        .mockResolvedValueOnce(mockRequestedSkill)
        .mockResolvedValueOnce(mockOfferedSkill);
      requestsRepository.create.mockReturnValue(mockRequest);
      requestsRepository.save.mockResolvedValue(mockRequest);

      const result = await service.create(dto, 'user-1');

      expect(result).toEqual(mockRequest);
      expect(notificationGateway.notifyUser).toHaveBeenCalledWith(
        'user-2',
        {
          type: 'newRequest',
          skillTitle: mockRequestedSkill.title,
          fromUser: {
            id: mockUser.id,
            name: mockUser.name,
            avatar: mockUser.avatar,
          },
        },
      );
    });

    it('должен выбросить ошибку если навыки одинаковые', async () => {
      const badDto: CreateRequestDto = { ...dto, offeredSkillId: 'skill-1' };
      
      await expect(service.create(badDto, 'user-1')).rejects.toThrow(ConflictException);
    });

    it('должен выбросить ошибку если отправитель не найден', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.create(dto, 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('должен выбросить ошибку если запрашиваемый навык не найден', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser);
      skillsRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.create(dto, 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('должен выбросить ошибку если предлагаемый навык не найден', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser);
      skillsRepository.findOne
        .mockResolvedValueOnce(mockRequestedSkill)
        .mockResolvedValueOnce(null);

      await expect(service.create(dto, 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findIncoming', () => {
    it('должен вернуть входящие запросы', async () => {
      requestsRepository.find.mockResolvedValue([mockRequest]);

      const result = await service.findIncoming('user-2');

      expect(result).toEqual([mockRequest]);
      expect(requestsRepository.find).toHaveBeenCalledWith({
        where: { receiver: { id: 'user-2' } },
        relations: ['sender', 'receiver', 'requestedSkill', 'offeredSkill'],
        order: { createdAt: 'DESC' },
      });
    });

    it('должен выбросить ошибку если запросов нет', async () => {
      requestsRepository.find.mockResolvedValue([]);

      await expect(service.findIncoming('user-2')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOutgoing', () => {
    it('должен вернуть исходящие запросы', async () => {
      requestsRepository.find.mockResolvedValue([mockRequest]);

      const result = await service.findOutgoing('user-1');

      expect(result).toEqual([mockRequest]);
      expect(requestsRepository.find).toHaveBeenCalledWith({
        where: { sender: { id: 'user-1' } },
        relations: ['sender', 'receiver', 'requestedSkill', 'offeredSkill'],
        order: { createdAt: 'DESC' },
      });
    });

    it('должен выбросить ошибку если запросов нет', async () => {
      requestsRepository.find.mockResolvedValue([]);

      await expect(service.findOutgoing('user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    const acceptedDto: UpdateRequestDto = { status: RequestStatus.ACCEPTED };
    const rejectedDto: UpdateRequestDto = { status: RequestStatus.REJECTED };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('должен принять запрос', async () => {
      requestsRepository.findOne
        .mockResolvedValueOnce(mockRequest);
      
      requestsRepository.manager.transaction.mockImplementationOnce(async (cb: any) => {
        const mockManager = {
          getRepository: jest.fn().mockReturnValue({
            create: jest.fn().mockReturnValue({}),
            save: jest.fn().mockResolvedValue([]),
          }),
        };
        await cb(mockManager);
      });

      const updatedRequest = { 
        ...mockRequest, 
        status: RequestStatus.ACCEPTED, 
        isRead: true 
      };
      
      requestsRepository.findOne
        .mockResolvedValueOnce(updatedRequest);

      const result = await service.updateStatus('request-1', acceptedDto, 'user-2');

      expect(result).toBeDefined();
      expect(result.status).toBe(RequestStatus.ACCEPTED);
      expect(result.isRead).toBe(true);
      expect(requestsRepository.manager.transaction).toHaveBeenCalled();
      expect(notificationGateway.notifyUser).toHaveBeenCalledWith('user-1', {
        type: 'requestAccepted',
        skillTitle: mockRequestedSkill.title,
        fromUser: {
          id: mockReceiver.id,
          name: mockReceiver.name,
          avatar: mockReceiver.avatar,
        },
      });
    });

    it('должен отклонить запрос', async () => {
      const pendingRequest = { 
        ...mockRequest, 
        status: RequestStatus.PENDING,
        isRead: false 
      };
      
      requestsRepository.findOne
        .mockResolvedValueOnce(pendingRequest);
      
      const updatedRequest = { 
        ...pendingRequest, 
        status: RequestStatus.REJECTED, 
        isRead: true 
      };
      
      requestsRepository.save.mockResolvedValueOnce(updatedRequest);
      
      requestsRepository.findOne
        .mockResolvedValueOnce(updatedRequest);

      const result = await service.updateStatus('request-1', rejectedDto, 'user-2');

      expect(result.status).toBe(RequestStatus.REJECTED);
      expect(result.isRead).toBe(true);
      expect(requestsRepository.save).toHaveBeenCalled();
      expect(requestsRepository.manager.transaction).not.toHaveBeenCalled();
      expect(notificationGateway.notifyUser).toHaveBeenCalledWith('user-1', {
        type: 'requestDeclined',
        skillTitle: mockRequestedSkill.title,
        fromUser: {
          id: mockReceiver.id,
          name: mockReceiver.name,
          avatar: mockReceiver.avatar,
        },
      });
    });

    it('должен выбросить ошибку если запрос не найден', async () => {
      requestsRepository.findOne.mockResolvedValue(null);

      await expect(service.updateStatus('request-1', acceptedDto, 'user-2'))
        .rejects.toThrow(NotFoundException);
    });

    it('должен выбросить ошибку если пользователь не получатель', async () => {
      requestsRepository.findOne.mockResolvedValue(mockRequest);

      await expect(service.updateStatus('request-1', acceptedDto, 'user-1'))
        .rejects.toThrow(ForbiddenException);
    });

    it('должен выбросить ошибку если статус запроса не PENDING', async () => {
      const acceptedRequest = { ...mockRequest, status: RequestStatus.ACCEPTED };
      requestsRepository.findOne.mockResolvedValue(acceptedRequest);

      await expect(service.updateStatus('request-1', acceptedDto, 'user-2'))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('removeOutgoing', () => {
    it('должен удалить исходящий запрос', async () => {
      requestsRepository.findOne.mockResolvedValue(mockRequest);
      requestsRepository.remove.mockResolvedValue(mockRequest);

      const result = await service.removeOutgoing('request-1', 'user-1');

      expect(result).toEqual({ message: 'Request deleted' });
      expect(requestsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'request-1' },
        relations: ['sender'],
      });
    });

    it('должен выбросить ошибку если запрос не найден', async () => {
      requestsRepository.findOne.mockResolvedValue(null);

      await expect(service.removeOutgoing('request-1', 'user-1'))
        .rejects.toThrow(NotFoundException);
    });

    it('должен выбросить ошибку если пользователь не отправитель', async () => {
      requestsRepository.findOne.mockResolvedValue(mockRequest);

      await expect(service.removeOutgoing('request-1', 'user-2'))
        .rejects.toThrow(ForbiddenException);
    });
  });
});