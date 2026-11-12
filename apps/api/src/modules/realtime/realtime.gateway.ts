import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WebSocketGateway, WebSocketServer, type OnGatewayConnection } from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';
import type { JwtPayload } from '../../libs/types/auth.type';
import { AUTH_COOKIE, readCookie } from '../../libs/utils/auth-cookie.util';
import { ADMIN_ROOM, memberRoom, warehouseRoom } from './realtime.rooms';

/**
 * WebSocket entry point: ws://<api>/realtime
 * Only logged-in members can connect (same JWT as the REST API).
 */
@WebSocketGateway({ namespace: 'realtime' })
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server: Namespace;

  constructor(private readonly jwt: JwtService) {}

  async handleConnection(client: Socket) {
    // Browser apps: the httpOnly cookie comes with the handshake. Other clients: auth.token
    const { token: authToken } = client.handshake.auth as { token?: unknown };
    const token =
      typeof authToken === 'string'
        ? authToken
        : readCookie(client.handshake.headers.cookie, AUTH_COOKIE);
    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      await client.join(memberRoom(payload.sub));
      if (payload.memberType === 'STAFF' && payload.warehouseId) {
        await client.join(warehouseRoom(payload.warehouseId));
      }
      if (payload.memberType === 'ADMIN') await client.join(ADMIN_ROOM);
    } catch {
      this.logger.warn(`Rejected socket ${client.id}: invalid token`);
      client.disconnect(true);
    }
  }
}
