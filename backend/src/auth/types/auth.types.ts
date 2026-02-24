import type { Request } from 'express';
import { UserRole } from '../../users/enums/user.enums';
import { Socket } from 'socket.io';

export type TJwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

export type TAuthRequest = Request & {
  user: TJwtPayload;
};

export type TAuthSocket = Socket & {
  user?: TJwtPayload;
};
