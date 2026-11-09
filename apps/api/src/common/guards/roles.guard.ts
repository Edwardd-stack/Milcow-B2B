import {
  ForbiddenException,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { MemberType } from '@milcow/shared';
import type { AuthRequest } from '../../libs/types/auth.type';
import { ROLES_KEY } from '../decorators/roles.decorator';

/** Runs after AuthGuard. If a route has @Roles(...), the member's type must be in the list. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<MemberType[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) return true;

    const { member } = context.switchToHttp().getRequest<AuthRequest>();
    if (!member || !roles.includes(member.memberType)) {
      throw new ForbiddenException('You do not have permission for this action');
    }
    return true;
  }
}
