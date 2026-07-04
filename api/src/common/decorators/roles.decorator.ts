import { SetMetadata } from '@nestjs/common';
import { RoleUser } from '@prisma/client';

export const ROLES_USER_KEY = 'roles_user';

export const RolesUser = (...roles: RoleUser[]) => SetMetadata(ROLES_USER_KEY, roles);
