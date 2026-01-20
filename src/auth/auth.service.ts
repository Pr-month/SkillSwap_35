import { Injectable } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { Response, Request } from 'express';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

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

  logout(_req: Request, res: Response) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    // TODO: очистить refreshToken в БД позже
    return { message: 'Logged out' };
  }

  refresh(req: Request, res: Response) {
    const user = req.user as { sub: string; email?: string; role?: string };

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

    res.cookie('accessToken', accessToken, { httpOnly: true });
    res.cookie('refreshToken', refreshToken, { httpOnly: true });

    return { message: 'Tokens refresh' };
  }
}
