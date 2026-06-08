import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { NotificationService } from './notification.service';
import { NotificationGqlType } from '../../libs/dto/notification/notification.type';
import { NotificationsInquiryInput } from '../../libs/dto/notification/notifications-inquiry.input';
import { NotificationsInquiryResult } from '../../libs/dto/notification/notifications-inquiry.result';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => NotificationGqlType)
export class NotificationResolver {
  constructor(private readonly notificationService: NotificationService) {}

  @Query(() => NotificationsInquiryResult, { name: 'getMyNotifications' })
  async getMyNotifications(
    @Args('input') input: NotificationsInquiryInput,
    @CurrentUser() user: any,
  ): Promise<NotificationsInquiryResult> {
    console.log('Query: getMyNotifications');
    return this.notificationService.getMyNotifications(user._id.toString(), input);
  }

  @Query(() => Int, { name: 'getUnreadNotificationCount' })
  async getUnreadNotificationCount(@CurrentUser() user: any): Promise<number> {
    console.log('Query: getUnreadNotificationCount');
    return this.notificationService.getUnreadCount(user._id.toString());
  }

  @Mutation(() => NotificationGqlType, { name: 'markNotificationAsRead', nullable: true })
  async markNotificationAsRead(
    @Args('notificationId') notificationId: string,
    @CurrentUser() user: any,
  ): Promise<NotificationGqlType | null> {
    console.log('Mutation: markNotificationAsRead');
    return this.notificationService.markAsRead(notificationId, user._id.toString()) as any;
  }

  @Mutation(() => Int, { name: 'markAllNotificationsAsRead' })
  async markAllNotificationsAsRead(@CurrentUser() user: any): Promise<number> {
    console.log('Mutation: markAllNotificationsAsRead');
    return this.notificationService.markAllAsRead(user._id.toString());
  }
}
