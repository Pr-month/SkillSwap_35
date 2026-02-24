import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { TAuthSocket } from '../auth/types/auth.types';
import { TNotificationPayload } from './types/notifications.types';

@WebSocketGateway({
  cors: { origin: true },
})
export class NotificationGateway {
  @WebSocketServer()
  private readonly server: Server;

  constructor(private readonly wsJwtGuard: WsJwtGuard) {}

  handleConnection(client: TAuthSocket) {
    try {
      const payload = this.wsJwtGuard.verifyClient(client);
      client.user = payload;
      client.join(payload.sub);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(_client: TAuthSocket) {}

  notifyUser(userId: string, payload: TNotificationPayload) {
    this.server.to(userId).emit('notificateNewRequest', payload);
  }
}
