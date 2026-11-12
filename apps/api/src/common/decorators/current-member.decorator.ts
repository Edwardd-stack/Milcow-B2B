import { createParamDecorator, UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import type { AuthMember, AuthRequest } from '../../libs/types/auth.type';

/** Injects the logged-in member:  me(@CurrentMember() member: AuthMember) */
export const CurrentMember = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthMember => {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    if (!request.member) throw new UnauthorizedException();
    return request.member;
  },
);
