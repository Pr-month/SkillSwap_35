import { SetMetadata } from '@nestjs/common';

// Декоратор Roles принимает список ролей и сохраняет в метаданные
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
