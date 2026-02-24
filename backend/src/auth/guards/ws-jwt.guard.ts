import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { TAuthSocket, TJwtPayload } from '../types/auth.types';
import { jwtConfig, TJwtConfig } from '../../config/jwt.config';

@Injectable()
export class WsJwtGuard {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY) private readonly jwt: TJwtConfig,
  ) {}

  verifyClient(client: TAuthSocket): TJwtPayload {
    const tokenRaw = client.handshake.query?.token;
    const token = Array.isArray(tokenRaw) ? tokenRaw[0] : tokenRaw;

    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException('Missing token');
    }
    try {
      return this.jwtService.verify<TJwtPayload>(token, {
        secret: this.jwt.secret,
      });
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
