import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { TJwtPayload } from '../types/jwt-payload.type';

function refreshCookieExtractor(req: Request): string | null {
  return req?.cookies?.refreshToken ?? null;
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([refreshCookieExtractor]),
      secretOrKey:
        process.env.JWT_REFRESH_SECRET ??
        process.env.JWT_SECRET ??
        'big_secret',
    });
  }

  validate(payload: TJwtPayload) {
    return payload;
  }
}
