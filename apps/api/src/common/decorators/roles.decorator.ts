import { SetMetadata } from '@nestjs/common';
import type { MemberType } from '@milcow/shared';

export const ROLES_KEY = 'roles';

/** @Roles('ADMIN') — only these member types may call the route. */
export const Roles = (...roles: MemberType[]) => SetMetadata(ROLES_KEY, roles);
