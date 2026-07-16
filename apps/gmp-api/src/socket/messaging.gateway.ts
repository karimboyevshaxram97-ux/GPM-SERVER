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
  authUser: any | null;
}

interface InfoPayload {
  event: string;
  totalClients: number;
  authUser: UserDocument | null;
  action: 'joined' | 'left' | 'sync';
}

@WebSocketGateway({ transports: ['websocket'], secure: false })
export class MessagingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger('MessagingGateway');
  private connectedClients = new Set<WebSocket>();
  private clientsAuthMap = new Map<WebSocket, UserDocument | null>();
  private messagesList: MessagePayload[] = [];

  @WebSocketServer()
  server: Server;

  constructor(private readonly authService: AuthService) {}

  afterInit(server: Server): void {
    this.logger.log('WebSocket initialized — total: [0]');
  }

  async handleConnection(client: WebSocket, req: any): Promise<void> {
    this.connectedClients.add(client);
    const authUser = await this.retrieveAuth(req);
    // Token tekshirilayotgan paytda client uzilgan bo'lsa, uni qayta ro'yxatga qo'shmaymiz.
    if (!this.connectedClients.has(client)) return;
    this.clientsAuthMap.set(client, authUser);

    const onlineUsers = this.getOnlineUsersCount();

    const nick = authUser
      ? `${authUser.firstName} ${authUser.lastName}`
      : 'Guest';
    this.logger.verbose(`CONNECTED [${nick}] — online users: [${onlineUsers}]`);

    const infoMsg: InfoPayload = {
      event: 'info',
      totalClients: onlineUsers,
      authUser,
      action: 'joined',
    };
    this.emitMessage(infoMsg);
    client.send(
      JSON.stringify({ event: 'getMessages', list: this.messagesList }),
    );
  }

  handleDisconnect(client: WebSocket): void {
    // Bir socket uchun disconnect ikki marta chaqirilsa son kamayib ketmasin.
    if (!this.connectedClients.delete(client)) return;
    const authUser = this.clientsAuthMap.get(client) ?? null;
    this.clientsAuthMap.delete(client);

    const onlineUsers = this.getOnlineUsersCount();

    const nick = authUser
      ? `${authUser.firstName} ${authUser.lastName}`
      : 'Guest';
    this.logger.verbose(
      `DISCONNECTED [${nick}] — online users: [${onlineUsers}]`,
    );

    const infoMsg: InfoPayload = {
      event: 'info',
      totalClients: onlineUsers,
      authUser,
      action: 'left',
    };
    this.broadcastMessage(client, infoMsg);
  }

  @SubscribeMessage('getOnlineCount')
  handleOnlineCount(client: WebSocket): void {
    this.sendToClient(client, {
      event: 'info',
      totalClients: this.getOnlineUsersCount(),
      authUser: this.clientsAuthMap.get(client) ?? null,
      action: 'sync',
    } satisfies InfoPayload);
  }

  @SubscribeMessage('message')
  async handleMessage(client: WebSocket, payload: any): Promise<void> {
    const authUser = this.clientsAuthMap.get(client) ?? null;
    const text = this.normalizeIncomingText(payload);
    if (!text) return;

    const newMessage: MessagePayload = { event: 'message', text, authUser };

    const nick = authUser
      ? `${authUser.firstName} ${authUser.lastName}`
      : 'Guest';
    this.logger.verbose(`MESSAGE [${nick}]: ${text}`);

    this.pushMessage(newMessage);

    this.emitMessage(newMessage);
    await this.emitGeminiReply(text);
  }

  private normalizeIncomingText(payload: any): string {
    if (typeof payload === 'string') {
      try {
        const parsed = JSON.parse(payload);
        return String(parsed?.data ?? parsed?.text ?? payload).trim();
      } catch {
        return payload.trim();
      }
    }

    return String(payload?.data ?? payload?.text ?? '').trim();
  }

  private pushMessage(message: MessagePayload): void {
    this.messagesList.push(message);
    if (this.messagesList.length > 5)
      this.messagesList.splice(0, this.messagesList.length - 5);
  }

  private async emitGeminiReply(userText: string): Promise<void> {
    const reply = await this.generateGeminiReply(userText);
    if (!reply) return;

    const aiMessage: MessagePayload = {
      event: 'message',
      text: reply,
      authUser: {
        _id: 'gemini-ai',
        firstName: 'Gemini',
        lastName: 'AI',
        avatar: '',
      },
    };

    this.pushMessage(aiMessage);
    this.emitMessage(aiMessage);
  }

  private async generateGeminiReply(userText: string): Promise<string | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const prompt = [
        'You are Gemini AI inside GMP, a Global Migration Platform live chat.',
        'Answer briefly, helpfully, and in the same language as the user when possible.',
        'If the user asks for legal, visa, or immigration certainty, explain that they should confirm with a verified agency or official source.',
        '',
        `User message: ${userText}`,
      ].join('\n');

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        this.logger.warn(`Gemini API failed: ${response.status}`);
        return null;
      }

      const data: any = await response.json();
      const text = data?.candidates?.[0]?.content?.parts
        ?.map((part: any) => part?.text)
        .filter(Boolean)
        .join('\n')
        .trim();

      return text || null;
    } catch (err: any) {
      this.logger.warn(`Gemini reply skipped: ${err?.message || err}`);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async retrieveAuth(req: any): Promise<UserDocument | null> {
    try {
      const { token } = Url.parse(req.url, true).query;
      return await this.authService.verifyToken(token as string);
    } catch {
      return null;
    }
  }

  /** Login qilgan user bir nechta tab ochsa bir marta, guestlar esa socket bo'yicha sanaladi. */
  private getOnlineUsersCount(): number {
    const authenticatedUsers = new Set<string>();
    let guests = 0;

    this.connectedClients.forEach((client) => {
      const authUser = this.clientsAuthMap.get(client);
      if (authUser?._id) authenticatedUsers.add(authUser._id.toString());
      else guests++;
    });

    return authenticatedUsers.size + guests;
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
  private broadcastMessage(
    sender: WebSocket,
    message: InfoPayload | MessagePayload,
  ): void {
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
