import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/enums/user.enums';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
