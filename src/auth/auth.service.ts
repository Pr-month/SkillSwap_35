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
import { RegisterDto } from './dto/register.dto';
import { jwtConfig, TJwtConfig } from '../config/jwt.config';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject(appConfig.KEY)
    private readonly config: TAppConfig,
    @Inject(jwtConfig.KEY)
    private readonly jwt: TJwtConfig,
  ) {}

  async register(registerDto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.usersRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    const payload: TJwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const tokens = await this.signTokens(payload);
    return { ...tokens };
  }

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

    const payload: TJwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // Генерация access token
    const { accessToken, refreshToken } = await this.signTokens(payload);

    // Хешируем refresh token перед сохранением в БД
    const hashedRefreshToken = await bcrypt.hash(
      refreshToken,
      this.config.hashSalt,
    );
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
      secret: this.jwt.secret,
      expiresIn: this.jwt.expiresIn as StringValue,
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.jwt.refreshSecret,
      expiresIn: this.jwt.refreshExpiresIn as StringValue,
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
