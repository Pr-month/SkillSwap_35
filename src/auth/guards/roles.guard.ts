import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TAuthRequest } from '../types/auth.types';
import { UserRole } from '../../users/enums/user.enums';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<UserRole[]>('roles', [
        context.getHandler(),
        context.getClass(),
      ]);

    // если роли не указаны — доступ разрешён
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<TAuthRequest>();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('User has no role');
    }

    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException('You do not have permission');
    }

    return true;
  }
}
