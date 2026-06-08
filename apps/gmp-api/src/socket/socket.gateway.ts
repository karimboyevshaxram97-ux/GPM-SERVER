import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'ws';
import { Logger } from '@nestjs/common';
import { MessagingService } from '../components/messaging/messaging.service';

@WebSocketGateway({ path: '/messaging', cors: { origin: '*' } })
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagingGateway.name);
  private userSockets = new Map<string, Socket>();

  constructor(private readonly messagingService: MessagingService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${(client as any).id}`);
  }

  handleDisconnect(client: Socket) {
    // Remove from userSockets map
    for (const [userId, socket] of this.userSockets.entries()) {
      if (socket === client) {
        this.userSockets.delete(userId);
        this.broadcastUserStatus(userId, false);
        break;
      }
    }
    this.logger.log(`Client disconnected`);
  }

  @SubscribeMessage('user:join')
  handleUserJoin(@MessageBody() data: { userId: string }, @ConnectedSocket() client: Socket) {
    this.userSockets.set(data.userId, client);
    this.broadcastUserStatus(data.userId, true);
    return { event: 'user:joined', data: { userId: data.userId } };
  }

  @SubscribeMessage('conversation:join')
  handleJoinConversation(@MessageBody() data: { conversationId: string }, @ConnectedSocket() client: Socket) {
    (client as any).conversationId = data.conversationId;
    return { event: 'conversation:joined', data };
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @MessageBody() data: { conversationId: string; senderId: string; text: string },
    @ConnectedSocket() client: Socket,
  ) {
    const message = await this.messagingService.sendMessage(data.conversationId, data.senderId, data.text);
    this.broadcastToConversation(data.conversationId, 'message:new', message);
    return { event: 'message:sent', data: message };
  }

  @SubscribeMessage('user:typing')
  handleTyping(
    @MessageBody() data: { conversationId: string; userId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    this.broadcastToConversation(data.conversationId, 'user:typing', data);
  }

  emitToUser(userId: string, event: string, data: any) {
    const socket = this.userSockets.get(userId);
    if (socket) {
      (socket as any).emit(event, data);
    }
  }

  private broadcastUserStatus(userId: string, isOnline: boolean) {
    this.server?.clients?.forEach((client: any) => {
      client.send(JSON.stringify({ event: isOnline ? 'user:online' : 'user:offline', data: { userId } }));
    });
  }

  private broadcastToConversation(conversationId: string, event: string, data: any) {
    this.server?.clients?.forEach((client: any) => {
      if (client.conversationId === conversationId) {
        client.send(JSON.stringify({ event, data }));
      }
    });
  }
}
