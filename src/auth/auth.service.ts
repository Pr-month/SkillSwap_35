import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Response, Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async login({ email, password }: LoginAuthDto, res: Response) {
    const user = await this.usersRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'role', 'refreshToken'], 
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Проверка пароля через bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // Генерация access token
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET ?? 'big_secret',
      expiresIn: '1h',
    });

    // Генерация refresh token
    const refreshToken = this.jwtService.sign(payload, {
      secret:
        process.env.JWT_REFRESH_SECRET ??
        process.env.JWT_SECRET ??
        'big_secret',
      expiresIn: '7d',
    });

    // Хешируем refresh token перед сохранением в БД
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    user.refreshToken = hashedRefreshToken;
    await this.usersRepository.save(user);

    // Кладём токены в httpOnly cookies
    res.cookie('accessToken', accessToken, { httpOnly: true });
    res.cookie('refreshToken', refreshToken, { httpOnly: true });

    return { message: 'Login successful' };
  }
  
  logout(_req: Request, res: Response) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    // TODO: очистить refreshToken в БД позже
    return { message: 'Logged out' };
  }

  refresh(req: Request, res: Response) {
    const user = req.user as { sub: string; email?: string; role?: string };

    const { accessToken, refreshToken } = this._generateTokens(user);

    res.cookie('accessToken', accessToken, { httpOnly: true });
    res.cookie('refreshToken', refreshToken, { httpOnly: true });

    return { message: 'Tokens refresh' };
  }

  private _generateTokens(user: {
    sub: string;
    email?: string;
    role?: string;
  }) {
    const accessToken = this.jwtService.sign(
      {
        sub: user.sub,
        email: user.email,
        role: user.role,
      },
      { secret: process.env.JWT_SECRET ?? 'big_secret', expiresIn: '1h' },
    );

    const refreshToken = this.jwtService.sign(
      {
        sub: user.sub,
        email: user.email,
        role: user.role,
      },
      {
        secret:
          process.env.JWT_REFRESH_SECRET ??
          process.env.JWT_SECRET ??
          'big_secret',
        expiresIn: '7d',
      },
    );

    return { accessToken, refreshToken };
  }
}
