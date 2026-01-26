import { Injectable } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { Response, Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { TAuthRequest, TJwtPayload } from './types/auth.types';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

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
