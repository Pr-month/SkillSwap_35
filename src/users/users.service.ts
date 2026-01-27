import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
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

  update(id: string, updateUserDto: UpdateUserDto) {
    void updateUserDto;
    return `This action updates a #${id} user`;
  }

  remove(id: string) {
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
  async changePassword(
    userId: string,
    dto: UpdateUserPasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.usersRepository.findOneByOrFail({ id: userId });
    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);

    if (!isMatch) {
      throw new UnauthorizedException(
        'Неправильный текущий пароль',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.usersRepository.update(userId, { password: hashedPassword });

    return { message: 'Password updated' };
  }
}
