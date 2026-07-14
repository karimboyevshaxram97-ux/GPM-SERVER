import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from '../../schemas/Notification.model';
import { NotificationGateway } from '../../socket/notification.gateway';
import { NotificationType } from '../../libs/enums';
import { NotificationsInquiryInput } from '../../libs/dto/notification/notifications-inquiry.input';
import { NotificationsInquiryResult } from '../../libs/dto/notification/notifications-inquiry.result';

export interface CreateNotificationDto {
  recipient: string;
  sender?: string;
  type: NotificationType;
  message: string;
  targetId?: string;
  targetType?: string;
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async notify(dto: CreateNotificationDto): Promise<NotificationDocument> {
    const notification = await this.notificationModel.create({
      recipient: new Types.ObjectId(dto.recipient),
      sender: dto.sender ? new Types.ObjectId(dto.sender) : undefined,
      type: dto.type,
      message: dto.message,
      targetId: dto.targetId ? new Types.ObjectId(dto.targetId) : undefined,
      targetType: dto.targetType,
    });

    this.notificationGateway.emitToUser(
      dto.recipient,
      'notification:new',
      notification,
    );
    return notification;
  }

  async getMyNotifications(
    userId: string,
    input: NotificationsInquiryInput,
  ): Promise<NotificationsInquiryResult> {
    const { isRead, page, limit } = input;

    const match: Record<string, any> = {
      recipient: new Types.ObjectId(userId),
    };
    if (isRead !== undefined) match.isRead = isRead;

    const skip = (page - 1) * limit;

    const result =
      await this.notificationModel.aggregate<NotificationsInquiryResult>([
        { $match: match },
        { $sort: { createdAt: -1 } },
        {
          $facet: {
            list: [{ $skip: skip }, { $limit: limit }],
            metaCounter: [{ $count: 'total' }],
          },
        },
      ]);

    return result[0];
  }

  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<NotificationDocument | null> {
    return this.notificationModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(notificationId),
          recipient: new Types.ObjectId(userId),
        },
        { isRead: true },
        { new: true },
      )
      .exec();
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.notificationModel
      .updateMany(
        { recipient: new Types.ObjectId(userId), isRead: false },
        { isRead: true },
      )
      .exec();
    return result.modifiedCount;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel
      .countDocuments({ recipient: new Types.ObjectId(userId), isRead: false })
      .exec();
  }
}
