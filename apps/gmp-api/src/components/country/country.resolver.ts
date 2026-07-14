import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CountryService } from './country.service';
import { CountryType } from '../../libs/dto/country/country.type';
import {
  CreateCountryInput,
  CountryFilterInput,
} from '../../libs/dto/country/country.input';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { GqlRolesGuard } from '../auth/guards/gql-roles.guard';
import { UserRole } from '../../libs/enums';

@Resolver(() => CountryType)
export class CountryResolver {
  constructor(private readonly countryService: CountryService) {}

  @Public()
  @Query(() => [CountryType], { name: 'countries' })
  async countries(
    @Args('filter', { nullable: true }) filter?: CountryFilterInput,
  ): Promise<CountryType[]> {
    return this.countryService.findAll(filter) as any;
  }

  @Public()
  @Query(() => CountryType, { name: 'country', nullable: true })
  async country(@Args('id') id: string): Promise<CountryType | null> {
    return this.countryService.findById(id) as any;
  }

  @Public()
  @Query(() => CountryType, { name: 'countryByCode', nullable: true })
  async countryByCode(@Args('code') code: string): Promise<CountryType | null> {
    return this.countryService.findByCode(code) as any;
  }

  @UseGuards(GqlRolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Mutation(() => CountryType, { name: 'createCountry' })
  async createCountry(
    @Args('input') input: CreateCountryInput,
  ): Promise<CountryType> {
    return this.countryService.create(input) as any;
  }

  @UseGuards(GqlRolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Mutation(() => CountryType, { name: 'toggleCountryActive', nullable: true })
  async toggleCountryActive(
    @Args('id') id: string,
  ): Promise<CountryType | null> {
    return this.countryService.toggleActive(id) as any;
  }
}
