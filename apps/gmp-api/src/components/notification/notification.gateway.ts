import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, WebSocket } from 'ws';
import { NotificationDocument } from '../../schemas/Notification.model';

@WebSocketGateway({ path: '/notifications', cors: { origin: '*' } })
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private readonly userSockets = new Map<string, WebSocket>();

  handleConnection(client: WebSocket) {
    this.logger.debug(`Notification client connected`);
  }

  handleDisconnect(client: WebSocket) {
    for (const [userId, socket] of this.userSockets.entries()) {
      if (socket === client) {
        this.userSockets.delete(userId);
        break;
      }
    }
  }

  @SubscribeMessage('notification:join')
  handleJoin(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: WebSocket,
  ) {
    this.userSockets.set(data.userId, client);
    return { event: 'notification:joined', data: { userId: data.userId } };
  }

  emitToUser(userId: string, notification: Partial<NotificationDocument>): void {
    const socket = this.userSockets.get(userId);
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ event: 'notification:new', data: notification }));
    }
  }
}
