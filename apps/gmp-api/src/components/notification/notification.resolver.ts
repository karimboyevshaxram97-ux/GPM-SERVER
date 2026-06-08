import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationGqlType } from '../../libs/dto/notification/notification.type';
import { NotificationsInquiryInput } from '../../libs/dto/notification/notifications-inquiry.input';
import { NotificationsInquiryResult } from '../../libs/dto/notification/notifications-inquiry.result';
import { GqlJwtAuthGuard } from '../auth/guards/gql-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => NotificationGqlType)
export class NotificationResolver {
  constructor(private readonly notificationService: NotificationService) {}

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => NotificationsInquiryResult, { name: 'getMyNotifications' })
  async getMyNotifications(
    @Args('input') input: NotificationsInquiryInput,
    @CurrentUser() user: any,
  ): Promise<NotificationsInquiryResult> {
    return this.notificationService.getMyNotifications(user._id.toString(), input);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => Int, { name: 'getUnreadNotificationCount' })
  async getUnreadNotificationCount(@CurrentUser() user: any): Promise<number> {
    return this.notificationService.getUnreadCount(user._id.toString());
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => NotificationGqlType, { name: 'markNotificationAsRead', nullable: true })
  async markNotificationAsRead(
    @Args('notificationId') notificationId: string,
    @CurrentUser() user: any,
  ): Promise<NotificationGqlType | null> {
    return this.notificationService.markAsRead(notificationId, user._id.toString()) as any;
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => Int, { name: 'markAllNotificationsAsRead' })
  async markAllNotificationsAsRead(@CurrentUser() user: any): Promise<number> {
    return this.notificationService.markAllAsRead(user._id.toString());
  }
}
