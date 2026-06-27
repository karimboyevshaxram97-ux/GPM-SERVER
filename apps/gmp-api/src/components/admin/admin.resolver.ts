import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import {
  PlatformStatsType,
  AdminUsersResult,
  AdminAgenciesResult,
  AuditLogsResult,
  MonthlyStatPoint,
} from '../../libs/dto/admin/admin.type';
import {
  ApproveAgencyInput,
  RejectAgencyInput,
  BanUserInput,
  SuspendAgencyInput,
  AdminUsersFilterInput,
  AdminAgenciesFilterInput,
} from '../../libs/dto/admin/admin.input';
import { AgencyType } from '../../libs/dto/agency/agency.type';
import { UserType } from '../../libs/dto/user/user.type';
import { GqlRolesGuard } from '../auth/guards/gql-roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../libs/enums';

@UseGuards(GqlRolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Resolver()
export class AdminResolver {
  constructor(private readonly adminService: AdminService) {}

  @Query(() => PlatformStatsType, { name: 'platformStats' })
  async platformStats(): Promise<PlatformStatsType> {
    return this.adminService.getPlatformStats();
  }

  @Query(() => [MonthlyStatPoint], { name: 'monthlyStats' })
  async monthlyStats(
    @Args('months', { type: () => Int, nullable: true }) months?: number,
  ): Promise<MonthlyStatPoint[]> {
    return this.adminService.getMonthlyStats(months ?? 6);
  }

  @Query(() => [AgencyType], { name: 'pendingVerifications' })
  async pendingVerifications(): Promise<AgencyType[]> {
    return this.adminService.getPendingVerifications() as any;
  }

  @Query(() => AdminUsersResult, { name: 'adminUsers' })
  async adminUsers(
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('filter', { nullable: true }) filter?: AdminUsersFilterInput,
  ): Promise<AdminUsersResult> {
    return this.adminService.getAllUsers(page ?? 1, limit ?? 20, filter);
  }

  @Query(() => AdminAgenciesResult, { name: 'adminAgencies' })
  async adminAgencies(
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('filter', { nullable: true }) filter?: AdminAgenciesFilterInput,
  ): Promise<AdminAgenciesResult> {
    return this.adminService.getAllAgencies(page ?? 1, limit ?? 20, filter);
  }

  @Query(() => AuditLogsResult, { name: 'auditLogs' })
  async auditLogs(
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<AuditLogsResult> {
    return this.adminService.getAuditLogs(page ?? 1, limit ?? 30);
  }

  @Mutation(() => AgencyType, { name: 'approveAgency' })
  async approveAgency(
    @CurrentUser() admin: any,
    @Args('input') input: ApproveAgencyInput,
  ): Promise<AgencyType> {
    return this.adminService.approveAgency(admin._id, input.agencyId) as any;
  }

  @Mutation(() => AgencyType, { name: 'rejectAgency' })
  async rejectAgency(
    @CurrentUser() admin: any,
    @Args('input') input: RejectAgencyInput,
  ): Promise<AgencyType> {
    return this.adminService.rejectAgency(admin._id, input.agencyId, input.reason) as any;
  }

  @Mutation(() => AgencyType, { name: 'suspendAgency' })
  async suspendAgency(
    @CurrentUser() admin: any,
    @Args('input') input: SuspendAgencyInput,
  ): Promise<AgencyType> {
    return this.adminService.suspendAgency(admin._id, input.agencyId) as any;
  }

  @Mutation(() => AgencyType, { name: 'activateAgency' })
  async activateAgency(
    @CurrentUser() admin: any,
    @Args('agencyId') agencyId: string,
  ): Promise<AgencyType> {
    return this.adminService.activateAgency(admin._id, agencyId) as any;
  }

  @Mutation(() => AgencyType, { name: 'adminDeleteAgency' })
  async adminDeleteAgency(
    @CurrentUser() admin: any,
    @Args('agencyId') agencyId: string,
  ): Promise<AgencyType> {
    return this.adminService.deleteAgency(admin._id, agencyId) as any;
  }

  @Mutation(() => UserType, { name: 'banUser' })
  async banUser(
    @CurrentUser() admin: any,
    @Args('input') input: BanUserInput,
  ): Promise<UserType> {
    return this.adminService.banUser(admin._id, input.userId) as any;
  }

  @Mutation(() => UserType, { name: 'unbanUser' })
  async unbanUser(
    @CurrentUser() admin: any,
    @Args('userId') userId: string,
  ): Promise<UserType> {
    return this.adminService.unbanUser(admin._id, userId) as any;
  }

  @Mutation(() => UserType, { name: 'adminDeleteUser' })
  async adminDeleteUser(
    @CurrentUser() admin: any,
    @Args('userId') userId: string,
  ): Promise<UserType> {
    return this.adminService.deleteUser(admin._id, userId) as any;
  }
}
