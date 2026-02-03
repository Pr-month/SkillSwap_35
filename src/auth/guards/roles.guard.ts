import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TAuthRequest } from '../types/auth.types'; // твой тип запроса с user

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // получаем роли из декоратора
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true; // если декоратора нет — доступ разрешён

    const request = context.switchToHttp().getRequest<TAuthRequest>();
    const user = request.user;

    if (!user || !user.roles) {
      throw new ForbiddenException('User has no roles');
    }

    const hasRole = user.roles.some((role: string) => requiredRoles.includes(role));
    if (!hasRole) {
      throw new ForbiddenException('You do not have permission (role)');
    }

    return true;
  }
}
