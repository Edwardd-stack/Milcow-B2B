import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { AuthMember, AuthRequest, JwtPayload } from '../../libs/types/auth.type';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Runs before every route (registered globally).
 * Checks "Authorization: Bearer <token>" and attaches the member to the request.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    const hasToken = scheme === 'Bearer' && !!token;

    // Public route: a logged-in visitor is still recognised (e.g. the chatbot logs who asked),
    // but a missing or bad token never blocks the request.
    if (isPublic) {
      if (hasToken) request.member = await this.verify(token).catch(() => undefined);
      return true;
    }

    if (!hasToken) throw new UnauthorizedException('Missing access token');
    try {
      request.member = await this.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
    return true;
  }

  private async verify(token: string): Promise<AuthMember> {
    const payload = await this.jwt.verifyAsync<JwtPayload>(token);
    return { id: payload.sub, memberType: payload.memberType, warehouseId: payload.warehouseId };
  }
}
