import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async login({ email, password }: LoginAuthDto) {
    // TODO: заменить проверку пароля на bcrypt
    // TODO: добавить генерацию JWT при успешном входе
    // TODO: возможно добавить refresh token и хранение сессий

    const user = await this.usersRepository.findOneBy({ email });
    
    if (!user || user.password !== password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return { message: 'Login successful', user: { email: user.email } };
  }
  
  create(createAuthDto: CreateAuthDto) {
    return 'This action adds a new auth';
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
