import { JwtService } from '@nestjs/jwt';
import type { TJwtPayload } from '../types/jwt-payload.type';
import type { StringValue } from 'ms';

export function signAccessToken(
  jwtService: JwtService,
  payload: TJwtPayload,
): string {
  return jwtService.sign(payload, {
    secret: process.env.JWT_SECRET ?? 'big_secret',
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '1h') as StringValue,
  });
}

export function signRefreshToken(
  jwtService: JwtService,
  payload: TJwtPayload,
): string {
  return jwtService.sign(payload, {
    secret:
      process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET ?? 'big_secret',
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as StringValue,
  });
}
