import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { AuthRequest, JwtPayload } from '../../libs/types/auth.type';
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
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthRequest>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Missing access token');
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      request.member = {
        id: payload.sub,
        memberType: payload.memberType,
        warehouseId: payload.warehouseId,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
    return true;
  }
}
