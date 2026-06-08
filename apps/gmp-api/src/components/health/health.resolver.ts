import { Resolver, Query } from '@nestjs/graphql';
import { Public } from '../auth/decorators/public.decorator';

@Resolver()
export class HealthResolver {
  @Public()
  @Query(() => String, { name: 'health' })
  health(): string {
    return 'ok';
  }
}
