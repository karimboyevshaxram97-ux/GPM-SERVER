import { Logger } from '@nestjs/common';
import {
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'ws';
import * as WebSocket from 'ws';
import * as Url from 'url';
import { AuthService } from '../auth/auth.service';
import { UserDocument } from '../../schemas/User.model';

@WebSocketGateway({ path: '/notifications', transports: ['websocket'], secure: false })
export class NotificationGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger('NotificationGateway');
  private summaryClients = 0;
  private clientsAuthMap = new Map<WebSocket, UserDocument | null>();

  @WebSocketServer()
  server: Server;

  constructor(private readonly authService: AuthService) {}

  afterInit(server: Server): void {
    this.logger.log(`Notification WS initialized — total: [${this.summaryClients}]`);
  }

  async handleConnection(client: WebSocket, req: any): Promise<void> {
    const authUser = await this.retrieveAuth(req);
    this.summaryClients++;
    this.clientsAuthMap.set(client, authUser);

    const nick = authUser ? `${authUser.firstName} ${authUser.lastName}` : 'Guest';
    this.logger.verbose(`CONNECTED [${nick}] — total: [${this.summaryClients}]`);
  }

  handleDisconnect(client: WebSocket): void {
    const authUser = this.clientsAuthMap.get(client);
    this.summaryClients--;
    this.clientsAuthMap.delete(client);

    const nick = authUser ? `${authUser.firstName} ${authUser.lastName}` : 'Guest';
    this.logger.verbose(`DISCONNECTED [${nick}] — total: [${this.summaryClients}]`);
  }

  /** Verified userId bo'yicha foydalanuvchiga notification yuboradi */
  emitToUser(userId: string, notification: any): void {
    this.clientsAuthMap.forEach((authUser, client) => {
      if (
        authUser?._id?.toString() === userId &&
        client.readyState === WebSocket.OPEN
      ) {
        client.send(JSON.stringify({ event: 'notification:new', data: notification }));
      }
    });
  }

  private async retrieveAuth(req: any): Promise<UserDocument | null> {
    try {
      const { token } = Url.parse(req.url, true).query;
      return await this.authService.verifyToken(token as string);
    } catch {
      return null;
    }
  }
}
