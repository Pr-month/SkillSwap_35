import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

type TJwtPayload = { sub: string; email?: string; role?: string };

function accessCookieExtractor(req: Request): string | null {
  return req?.cookies?.accessToken ?? null;
}

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([accessCookieExtractor]),
      secretOrKey: process.env.JWT_SECRET ?? 'big_secret',
    });
  }

  validate(payload: TJwtPayload) {
    return payload;
  }
}
