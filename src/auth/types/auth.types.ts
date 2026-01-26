import type { Request } from 'express';

export type TJwtPayload = { sub: string; email: string; role: string };

export type TAuthRequest = Request & {
  user: TJwtPayload;
};
