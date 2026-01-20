import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';

@Injectable()
export class AuthService {
  login({ email, password }: LoginAuthDto) {
    // временная логика, без БД
    if (email === 'test@test.com' && password === '123456') {
      return {
        message: 'Login successful',
        user: { email },
      };
    }

    throw new UnauthorizedException('Invalid credentials');
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
