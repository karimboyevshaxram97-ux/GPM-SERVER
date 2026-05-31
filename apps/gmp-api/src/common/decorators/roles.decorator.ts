import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/user.enum';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
