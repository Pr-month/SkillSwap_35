import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';
import { appConfig, TAppConfig } from '../config/app.config';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @Inject(appConfig.KEY)
    private readonly config: TAppConfig,
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

  async findCurrentUser(userId: string) {
    const user = await this.usersRepository.findOneByOrFail({ id: userId });
    return this.toUserDto(user);
  }

  async updateCurrentUser(userId: string, updateUserDto: UpdateUserDto) {
    const user = await this.usersRepository.findOneByOrFail({ id: userId });
    const updates = Object.fromEntries(
      Object.entries(updateUserDto).filter(([, value]) => value !== undefined),
    );
    Object.assign(user, updates);
    const savedUser = await this.usersRepository.save(user);
    return this.toUserDto(savedUser);
  }

  async changePassword(
    userId: string,
    dto: UpdateUserPasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.usersRepository.findOneByOrFail({ id: userId });
    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Неправильный текущий пароль');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, this.config.hashSalt);
    await this.usersRepository.update(userId, { password: hashedPassword });

    return { message: 'Password updated' };
  }

  private toUserDto(user: User): UserDto {
    return plainToInstance(UserDto, user, { excludeExtraneousValues: true });
  }
}