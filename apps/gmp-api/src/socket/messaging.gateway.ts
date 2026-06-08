import { Logger } from '@nestjs/common';
import {
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'ws';
import * as WebSocket from 'ws';
import * as Url from 'url';
import { AuthService } from '../components/auth/auth.service';
import { UserDocument } from '../schemas/User.model';

interface MessagePayload {
  event: string;
  text: string;
  authUser: UserDocument | null;
}

interface InfoPayload {
  event: string;
  totalClients: number;
  authUser: UserDocument | null;
  action: 'joined' | 'left';
}

@WebSocketGateway({ transports: ['websocket'], secure: false })
export class MessagingGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger('MessagingGateway');
  private summaryClients = 0;
  private clientsAuthMap = new Map<WebSocket, UserDocument | null>();
  private messagesList: MessagePayload[] = [];

  @WebSocketServer()
  server: Server;

  constructor(private readonly authService: AuthService) {}

  afterInit(server: Server): void {
    this.logger.log(`WebSocket initialized — total: [${this.summaryClients}]`);
  }

  async handleConnection(client: WebSocket, req: any): Promise<void> {
    const authUser = await this.retrieveAuth(req);
    this.summaryClients++;
    this.clientsAuthMap.set(client, authUser);

    const nick = authUser ? `${authUser.firstName} ${authUser.lastName}` : 'Guest';
    this.logger.verbose(`CONNECTED [${nick}] — total: [${this.summaryClients}]`);

    const infoMsg: InfoPayload = {
      event: 'info',
      totalClients: this.summaryClients,
      authUser,
      action: 'joined',
    };
    this.emitMessage(infoMsg);
    client.send(JSON.stringify({ event: 'getMessages', list: this.messagesList }));
  }

  handleDisconnect(client: WebSocket): void {
    const authUser = this.clientsAuthMap.get(client) ?? null;
    this.summaryClients--;
    this.clientsAuthMap.delete(client);

    const nick = authUser ? `${authUser.firstName} ${authUser.lastName}` : 'Guest';
    this.logger.verbose(`DISCONNECTED [${nick}] — total: [${this.summaryClients}]`);

    const infoMsg: InfoPayload = {
      event: 'info',
      totalClients: this.summaryClients,
      authUser,
      action: 'left',
    };
    this.broadcastMessage(client, infoMsg);
  }

  @SubscribeMessage('message')
  async handleMessage(client: WebSocket, payload: string): Promise<void> {
    const authUser = this.clientsAuthMap.get(client) ?? null;
    const newMessage: MessagePayload = { event: 'message', text: payload, authUser };

    const nick = authUser ? `${authUser.firstName} ${authUser.lastName}` : 'Guest';
    this.logger.verbose(`MESSAGE [${nick}]: ${payload}`);

    this.messagesList.push(newMessage);
    if (this.messagesList.length > 5) this.messagesList.splice(0, this.messagesList.length - 5);

    this.emitMessage(newMessage);
  }

  private async retrieveAuth(req: any): Promise<UserDocument | null> {
    try {
      const { token } = Url.parse(req.url, true).query;
      return await this.authService.verifyToken(token as string);
    } catch {
      return null;
    }
  }

  /** Barcha clientlarga yuboradi */
  private emitMessage(message: InfoPayload | MessagePayload): void {
    this.server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  /** Yuboruvchidan boshqa barcha clientlarga yuboradi */
  private broadcastMessage(sender: WebSocket, message: InfoPayload | MessagePayload): void {
    this.server.clients.forEach((client) => {
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  /** Faqat bitta clientga yuboradi */
  private sendToClient(client: WebSocket, message: any): void {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }
}

/*
 * MESSAGE TARGETS:
 * 1. sendToClient     — faqat bitta client
 * 2. broadcastMessage — yuboruvchidan boshqa hammaga
 * 3. emitMessage      — barcha clientlarga
 */
