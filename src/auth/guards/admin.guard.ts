import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserRole } from '../../users/enums/user.enums';
import type { TAuthRequest } from '../types/auth.types';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<TAuthRequest>();
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied');
    }
    return true;
  }
}
