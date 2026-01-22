import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
    constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>, // <- вот это важно
  ) {}

  create(createUserDto: CreateUserDto) {
    void createUserDto;
    return 'This action adds a new user';
  }

  findAll() {
    return this.usersRepository.find();
  }

  async findOne(id: string) {
    return this.usersRepository.findOneBy({ id });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    void updateUserDto;
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async findCurrentUser() {
    // TODO: заменить на получение пользователя из JWT/сессии
    return this.usersRepository.findOneBy({ id: "saasas" }); // пока тестовый пользователь
  }

  async updateCurrentUser(updateUserDto: UpdateUserDto) {
    // TODO: заменить на получение id из JWT
    const user = await this.usersRepository.findOneBy({ id: "asasas" });
    if (!user) return null;
    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }
}
