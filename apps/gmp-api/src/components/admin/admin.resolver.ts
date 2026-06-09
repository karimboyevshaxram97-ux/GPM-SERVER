import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PlatformStatsType } from '../../libs/dto/admin/admin.type';
import { ApproveAgencyInput, RejectAgencyInput, BanUserInput, SuspendAgencyInput } from '../../libs/dto/admin/admin.input';
import { AgencyType } from '../../libs/dto/agency/agency.type';
import { UserType } from '../../libs/dto/user/user.type';
import { GqlRolesGuard } from '../auth/guards/gql-roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../libs/enums';

@UseGuards(GqlRolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Resolver()
export class AdminResolver {
  constructor(private readonly adminService: AdminService) {}

  @Query(() => PlatformStatsType, { name: 'platformStats' })
  async platformStats(): Promise<PlatformStatsType> {
    console.log('Query: platformStats');
    return this.adminService.getPlatformStats();
  }

  @Query(() => [AgencyType], { name: 'pendingVerifications' })
  async pendingVerifications(): Promise<AgencyType[]> {
    console.log('Query: pendingVerifications');
    return this.adminService.getPendingVerifications() as any;
  }

  @Query(() => [UserType], { name: 'adminUsers' })
  async adminUsers(
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<UserType[]> {
    console.log('Query: adminUsers');
    return this.adminService.getAllUsers(page ?? 1, limit ?? 20) as any;
  }

  @Query(() => [AgencyType], { name: 'adminAgencies' })
  async adminAgencies(
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<AgencyType[]> {
    console.log('Query: adminAgencies');
    return this.adminService.getAllAgencies(page ?? 1, limit ?? 20) as any;
  }

  @Mutation(() => AgencyType, { name: 'approveAgency' })
  async approveAgency(@Args('input') input: ApproveAgencyInput): Promise<AgencyType> {
    console.log('Mutation: approveAgency');
    return this.adminService.approveAgency(input.agencyId) as any;
  }

  @Mutation(() => AgencyType, { name: 'rejectAgency' })
  async rejectAgency(@Args('input') input: RejectAgencyInput): Promise<AgencyType> {
    console.log('Mutation: rejectAgency');
    return this.adminService.rejectAgency(input.agencyId, input.reason) as any;
  }

  @Mutation(() => AgencyType, { name: 'suspendAgency' })
  async suspendAgency(@Args('input') input: SuspendAgencyInput): Promise<AgencyType> {
    console.log('Mutation: suspendAgency');
    return this.adminService.suspendAgency(input.agencyId) as any;
  }

  @Mutation(() => AgencyType, { name: 'activateAgency' })
  async activateAgency(@Args('agencyId') agencyId: string): Promise<AgencyType> {
    console.log('Mutation: activateAgency');
    return this.adminService.activateAgency(agencyId) as any;
  }

  @Mutation(() => UserType, { name: 'banUser' })
  async banUser(@Args('input') input: BanUserInput): Promise<UserType> {
    console.log('Mutation: banUser');
    return this.adminService.banUser(input.userId) as any;
  }

  @Mutation(() => UserType, { name: 'unbanUser' })
  async unbanUser(@Args('userId') userId: string): Promise<UserType> {
    console.log('Mutation: unbanUser');
    return this.adminService.unbanUser(userId) as any;
  }
}
