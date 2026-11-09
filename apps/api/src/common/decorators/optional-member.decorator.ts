import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthMember, AuthRequest } from '../../libs/types/auth.type';

/** On @Public routes: the logged-in member, or undefined for anonymous visitors */
export const OptionalMember = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthMember | undefined =>
    context.switchToHttp().getRequest<AuthRequest>().member,
);
