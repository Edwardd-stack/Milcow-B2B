import type { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { Server, ServerOptions } from 'socket.io';

/** Socket.io with the same CORS whitelist as the REST API (CORS_ORIGINS in .env). */
export class SocketIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly origins: string[],
  ) {
    super(app);
  }

  override createIOServer(port: number, options?: ServerOptions): Server {
    const withCors = { ...options, cors: { origin: this.origins, credentials: true } };
    return super.createIOServer(port, withCors as ServerOptions);
  }
}
