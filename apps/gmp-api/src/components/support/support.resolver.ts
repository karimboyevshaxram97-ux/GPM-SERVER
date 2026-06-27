import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { WithoutAuth } from '../auth/guards/without.guard';
import { GqlRolesGuard } from '../auth/guards/gql-roles.guard';
import { UserRole } from '../../libs/enums';
import { SupportService } from './support.service';
import {
  CreateSupportTicketInput,
  SupportTicketsInquiryInput,
  UpdateSupportTicketStatusInput,
} from '../../libs/dto/support/support.input';
import { SupportTicketType, SupportTicketsResult } from '../../libs/dto/support/support.type';

@Resolver(() => SupportTicketType)
export class SupportResolver {
  constructor(private readonly supportService: SupportService) {}

  @WithoutAuth()
  @Mutation(() => SupportTicketType, { name: 'createSupportTicket' })
  async createSupportTicket(
    @Args('input') input: CreateSupportTicketInput,
    @CurrentUser() user: any,
  ): Promise<SupportTicketType> {
    console.log('Mutation: createSupportTicket');
    return this.supportService.create(input, user) as any;
  }

  @UseGuards(GqlRolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Query(() => SupportTicketsResult, { name: 'adminSupportTickets' })
  async adminSupportTickets(
    @Args('input') input: SupportTicketsInquiryInput,
  ): Promise<SupportTicketsResult> {
    console.log('Query: adminSupportTickets');
    return this.supportService.getTickets(input);
  }

  @UseGuards(GqlRolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Mutation(() => SupportTicketType, { name: 'updateSupportTicketStatus' })
  async updateSupportTicketStatus(
    @Args('input') input: UpdateSupportTicketStatusInput,
  ): Promise<SupportTicketType> {
    console.log('Mutation: updateSupportTicketStatus');
    return this.supportService.updateStatus(input) as any;
  }
}
