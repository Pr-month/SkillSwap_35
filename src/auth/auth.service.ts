import { Injectable } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { Response, Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { signAccessToken, signRefreshToken } from './utils/tokens';
import { TJwtPayload } from './types/jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  logout(_req: Request, res: Response) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    // TODO: очистить refreshToken в БД позже
    return { message: 'Logged out' };
  }

  refresh(req: Request, res: Response) {
    const user = req.user as TJwtPayload;

    const accessToken = signAccessToken(this.jwtService, user);
    const refreshToken = signRefreshToken(this.jwtService, user);

    res.cookie('accessToken', accessToken, { httpOnly: true });
    res.cookie('refreshToken', refreshToken, { httpOnly: true });

    return { message: 'Tokens refresh' };
  }
}
