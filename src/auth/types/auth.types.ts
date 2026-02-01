import type { Request } from 'express';
import { UserRole } from 'src/users/enums/user.enums';

export type TJwtPayload = { sub: string; email: string; role: UserRole };

export type TAuthRequest = Request & {
  user: TJwtPayload;
};
