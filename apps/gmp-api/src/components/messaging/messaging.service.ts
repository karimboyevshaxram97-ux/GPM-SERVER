import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Conversation,
  ConversationDocument,
} from '../../schemas/Conversation.model';
import { Message, MessageDocument } from '../../schemas/Message.model';
import { Agency, AgencyDocument } from '../../schemas/Agency.model';
import { ConversationStatus } from '../../libs/enums';
import { NotificationGateway } from '../../socket/notification.gateway';

@Injectable()
export class MessagingService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Agency.name) private agencyModel: Model<AgencyDocument>,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  private pushToOtherParticipants(
    conversation: ConversationDocument,
    excludeUserId: string,
    event: string,
    data: any,
  ): void {
    for (const participantId of conversation.participants) {
      const id = participantId.toString();
      if (id !== excludeUserId)
        this.notificationGateway.emitToUser(id, event, data);
    }
  }

  private getUnreadCountFromMap(
    unreadCountByUser: any,
    userId: string,
  ): number {
    const value =
      typeof unreadCountByUser?.get === 'function'
        ? unreadCountByUser.get(userId)
        : unreadCountByUser?.[userId];

    return Number(value ?? 0);
  }

  private normalizeConversation(conversation: any, userId: string): any {
    if (!conversation) return conversation;

    const item = conversation?.toObject
      ? conversation.toObject()
      : { ...conversation };
    const lastMessage =
      item.lastMessage && typeof item.lastMessage === 'object'
        ? item.lastMessage.text
        : undefined;

    return {
      ...item,
      participants: item.participants ?? [],
      lastMessage,
      unreadCount: this.getUnreadCountFromMap(
        conversation.unreadCountByUser ?? item.unreadCountByUser,
        userId,
      ),
      status: item.status ?? ConversationStatus.ACTIVE,
    };
  }

  async getOrCreateConversation(
    userId: string,
    recipientId: string,
    agencyId?: string,
  ): Promise<any> {
    if (
      !Types.ObjectId.isValid(userId) ||
      !Types.ObjectId.isValid(recipientId) ||
      (agencyId && !Types.ObjectId.isValid(agencyId))
    ) {
      throw new BadRequestException('Invalid conversation participant');
    }

    const userObjId = new Types.ObjectId(userId);
    const recipientObjId = new Types.ObjectId(recipientId);
    if (userObjId.equals(recipientObjId)) {
      throw new BadRequestException(
        'Cannot create a conversation with yourself',
      );
    }

    // agency har doim so'rovda ishtirok etadi (berilmasa — "agency yo'q" degan aniq shart) —
    // aks holda ikki kishi orasidagi oldingi agency-bog'liq suhbat oddiy shaxsiy xabar
    // yozishda (yoki aksincha) noto'g'ri qaytishi mumkin edi.
    const query: any = {
      participants: { $all: [userObjId, recipientObjId] },
      agency: agencyId ? new Types.ObjectId(agencyId) : { $exists: false },
    };
    if (agencyId) {
      const agency = await this.agencyModel.findById(agencyId).exec();
      if (!agency) throw new NotFoundException('Agency not found');

      const isAgencyRecipient =
        agency.owner?.toString() === recipientId ||
        (agency.admins ?? []).some(
          (adminId) => adminId.toString() === recipientId,
        );
      if (!isAgencyRecipient) {
        throw new ForbiddenException(
          'Recipient is not an admin of this agency',
        );
      }
    }

    const existing = await this.conversationModel
      .findOne(query)
      .populate('lastMessage', 'text')
      .exec();

    if (existing) return this.normalizeConversation(existing, userId);

    const conversation = new this.conversationModel({
      participants: [userObjId, recipientObjId],
      agency: agencyId ? new Types.ObjectId(agencyId) : undefined,
      unreadCountByUser: {},
    });
    const saved = await conversation.save();
    return this.normalizeConversation(saved, userId);
  }

  async getMyConversations(userId: string): Promise<any[]> {
    const conversations = await this.conversationModel
      .find({
        participants: new Types.ObjectId(userId),
        status: { $ne: ConversationStatus.BLOCKED },
      })
      .sort({ lastMessageAt: -1 })
      .populate('lastMessage', 'text')
      .exec();
    return conversations.map((c) => this.normalizeConversation(c, userId));
  }

  async getConversationMessages(
    conversationId: string,
    userId: string,
    limit = 50,
    skip = 0,
  ): Promise<MessageDocument[]> {
    const conversation = await this.conversationModel
      .findById(conversationId)
      .exec();
    if (!conversation) throw new NotFoundException('Conversation not found');

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId,
    );
    if (!isParticipant)
      throw new ForbiddenException('Not a participant of this conversation');

    const messages = await this.messageModel
      .find({ conversation: new Types.ObjectId(conversationId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return messages.reverse();
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    text: string,
    attachmentUrls?: string[],
  ): Promise<MessageDocument> {
    const conversation = await this.conversationModel
      .findById(conversationId)
      .exec();
    if (!conversation) throw new NotFoundException('Conversation not found');

    if (conversation.status === ConversationStatus.BLOCKED) {
      throw new ForbiddenException('Conversation is blocked');
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === senderId,
    );
    if (!isParticipant)
      throw new ForbiddenException('Not a participant of this conversation');

    const attachments = (attachmentUrls || []).map((url) => ({
      url,
      type: 'file',
      name: url.split('/').pop() || 'file',
    }));

    const message = new this.messageModel({
      conversation: new Types.ObjectId(conversationId),
      sender: new Types.ObjectId(senderId),
      text,
      attachments,
    });
    const saved = await message.save();

    // Atomik $set/$inc — bir nechta xabar bir vaqtda yuborilsa ham, load→mutate→save
    // naqshidagi kabi bir-birini bosib ketmaydi (har bir kalit alohida $inc qilinadi).
    const conversationUpdate: any = {
      $set: { lastMessage: saved._id, lastMessageAt: new Date() },
      $inc: {},
    };
    for (const participantId of conversation.participants) {
      const key = participantId.toString();
      if (key !== senderId)
        conversationUpdate.$inc[`unreadCountByUser.${key}`] = 1;
    }
    await this.conversationModel
      .findByIdAndUpdate(conversationId, conversationUpdate)
      .exec();

    this.pushToOtherParticipants(conversation, senderId, 'message:new', saved);

    return saved;
  }

  async editMessage(
    messageId: string,
    userId: string,
    text: string,
  ): Promise<MessageDocument> {
    const message = await this.messageModel.findById(messageId).exec();
    if (!message) throw new NotFoundException('Message not found');
    if (message.sender.toString() !== userId)
      throw new ForbiddenException("Cannot edit another user's message");

    message.text = text;
    message.isEdited = true;
    message.editedAt = new Date();
    const saved = await message.save();

    const conversation = await this.conversationModel
      .findById(message.conversation)
      .exec();
    if (conversation)
      this.pushToOtherParticipants(
        conversation,
        userId,
        'message:edited',
        saved,
      );

    return saved;
  }

  async markConversationAsRead(
    conversationId: string,
    userId: string,
  ): Promise<boolean> {
    const conversation = await this.conversationModel
      .findById(conversationId)
      .exec();
    if (!conversation) throw new NotFoundException('Conversation not found');
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId,
    );
    if (!isParticipant)
      throw new ForbiddenException('Not a participant of this conversation');

    await this.conversationModel
      .findByIdAndUpdate(conversationId, {
        $set: { [`unreadCountByUser.${userId}`]: 0 },
      })
      .exec();

    await this.messageModel
      .updateMany(
        {
          conversation: new Types.ObjectId(conversationId),
          sender: { $ne: new Types.ObjectId(userId) },
        },
        { isRead: true },
      )
      .exec();

    this.pushToOtherParticipants(conversation, userId, 'conversation:read', {
      conversationId,
      readBy: userId,
    });

    return true;
  }

  async blockConversation(
    conversationId: string,
    userId: string,
  ): Promise<any> {
    const conversation = await this.conversationModel
      .findById(conversationId)
      .exec();
    if (!conversation) throw new NotFoundException('Conversation not found');

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId,
    );
    if (!isParticipant)
      throw new ForbiddenException('Not a participant of this conversation');

    conversation.status = ConversationStatus.BLOCKED;
    conversation.blockedBy = new Types.ObjectId(userId);
    const saved = await conversation.save();
    return this.normalizeConversation(saved, userId);
  }

  async getUnreadCount(
    conversationId: string,
    userId: string,
  ): Promise<number> {
    const conversation = await this.conversationModel
      .findById(conversationId)
      .exec();
    if (!conversation) return 0;
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId,
    );
    if (!isParticipant)
      throw new ForbiddenException('Not a participant of this conversation');
    return conversation.unreadCountByUser.get(userId) || 0;
  }
}
