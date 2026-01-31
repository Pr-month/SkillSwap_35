import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Response, Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { TAuthRequest, TJwtPayload } from './types/auth.types';
import * as bcrypt from 'bcrypt';
import { appConfig, TAppConfig } from '../config/app.config';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject(appConfig.KEY)
    private readonly config: TAppConfig,
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
    const hashedRefreshToken = await bcrypt.hash(refreshToken, this.config.hashSalt);
    user.refreshToken = hashedRefreshToken;
    await this.usersRepository.save(user);

    // Кладём токены в httpOnly cookies
    res.cookie('accessToken', accessToken, { httpOnly: true });
    res.cookie('refreshToken', refreshToken, { httpOnly: true });

    return { message: 'Login successful' };
  }
  
  logout(_req: TAuthRequest, res: Response) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    // TODO: очистить refreshToken в БД позже
    return { message: 'Logged out' };
  }

  private async signTokens(payload: TJwtPayload) {
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET ?? 'big_secret',
      expiresIn: (process.env.JWT_EXPIRES_IN ?? '1h') as StringValue,
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret:
        process.env.JWT_REFRESH_SECRET ??
        process.env.JWT_SECRET ??
        'big_secret',
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as StringValue,
    });
      return { accessToken, refreshToken };
  }

  async refresh(req: TAuthRequest, res: Response) {
    const { accessToken, refreshToken } = await this.signTokens(req.user);

    res.cookie('accessToken', accessToken, { httpOnly: true });
    res.cookie('refreshToken', refreshToken, { httpOnly: true });

    return { message: 'Tokens refresh' };
  }
}
