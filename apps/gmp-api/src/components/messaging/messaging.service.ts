import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from '../../schemas/Conversation.model';
import { Message, MessageDocument } from '../../schemas/Message.model';
import { ConversationStatus } from '../../libs/enums';

@Injectable()
export class MessagingService {
  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  async getOrCreateConversation(userId: string, recipientId: string, agencyId?: string): Promise<ConversationDocument> {
    const userObjId = new Types.ObjectId(userId);
    const recipientObjId = new Types.ObjectId(recipientId);

    const existing = await this.conversationModel
      .findOne({ participants: { $all: [userObjId, recipientObjId] } })
      .exec();

    if (existing) return existing;

    const conversation = new this.conversationModel({
      participants: [userObjId, recipientObjId],
      agency: agencyId ? new Types.ObjectId(agencyId) : undefined,
      unreadCountByUser: {},
    });
    return conversation.save();
  }

  async getMyConversations(userId: string): Promise<ConversationDocument[]> {
    return this.conversationModel
      .find({ participants: new Types.ObjectId(userId), status: { $ne: ConversationStatus.BLOCKED } })
      .sort({ lastMessageAt: -1 })
      .exec();
  }

  async getConversationMessages(conversationId: string, userId: string, limit = 50, skip = 0): Promise<MessageDocument[]> {
    const conversation = await this.conversationModel.findById(conversationId).exec();
    if (!conversation) throw new NotFoundException('Conversation not found');

    const isParticipant = conversation.participants.some((p) => p.toString() === userId);
    if (!isParticipant) throw new ForbiddenException('Not a participant of this conversation');

    return this.messageModel
      .find({ conversation: new Types.ObjectId(conversationId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async sendMessage(conversationId: string, senderId: string, text: string, attachmentUrls?: string[]): Promise<MessageDocument> {
    const conversation = await this.conversationModel.findById(conversationId).exec();
    if (!conversation) throw new NotFoundException('Conversation not found');

    if (conversation.status === ConversationStatus.BLOCKED) {
      throw new ForbiddenException('Conversation is blocked');
    }

    const isParticipant = conversation.participants.some((p) => p.toString() === senderId);
    if (!isParticipant) throw new ForbiddenException('Not a participant of this conversation');

    const attachments = (attachmentUrls || []).map((url) => ({ url, type: 'file', name: url.split('/').pop() || 'file' }));

    const message = new this.messageModel({
      conversation: new Types.ObjectId(conversationId),
      sender: new Types.ObjectId(senderId),
      text,
      attachments,
    });
    const saved = await message.save();

    // Update conversation last message
    conversation.lastMessage = saved._id as Types.ObjectId;
    conversation.lastMessageAt = new Date();

    // Increment unread count for other participants
    for (const participantId of conversation.participants) {
      if (participantId.toString() !== senderId) {
        const key = participantId.toString();
        const current = conversation.unreadCountByUser.get(key) || 0;
        conversation.unreadCountByUser.set(key, current + 1);
      }
    }
    conversation.markModified('unreadCountByUser');
    await conversation.save();

    return saved;
  }

  async editMessage(messageId: string, userId: string, text: string): Promise<MessageDocument> {
    const message = await this.messageModel.findById(messageId).exec();
    if (!message) throw new NotFoundException('Message not found');
    if (message.sender.toString() !== userId) throw new ForbiddenException('Cannot edit another user\'s message');

    message.text = text;
    message.isEdited = true;
    message.editedAt = new Date();
    return message.save();
  }

  async markConversationAsRead(conversationId: string, userId: string): Promise<boolean> {
    const conversation = await this.conversationModel.findById(conversationId).exec();
    if (!conversation) throw new NotFoundException('Conversation not found');

    conversation.unreadCountByUser.set(userId, 0);
    conversation.markModified('unreadCountByUser');
    await conversation.save();

    await this.messageModel.updateMany(
      { conversation: new Types.ObjectId(conversationId), sender: { $ne: new Types.ObjectId(userId) } },
      { isRead: true },
    ).exec();

    return true;
  }

  async blockConversation(conversationId: string, userId: string): Promise<ConversationDocument> {
    const conversation = await this.conversationModel.findById(conversationId).exec();
    if (!conversation) throw new NotFoundException('Conversation not found');

    const isParticipant = conversation.participants.some((p) => p.toString() === userId);
    if (!isParticipant) throw new ForbiddenException('Not a participant of this conversation');

    conversation.status = ConversationStatus.BLOCKED;
    conversation.blockedBy = new Types.ObjectId(userId);
    return conversation.save();
  }

  async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    const conversation = await this.conversationModel.findById(conversationId).exec();
    if (!conversation) return 0;
    return conversation.unreadCountByUser.get(userId) || 0;
  }
}
