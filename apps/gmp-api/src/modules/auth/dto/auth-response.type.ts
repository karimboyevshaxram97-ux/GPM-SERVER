import { ObjectType, Field } from '@nestjs/graphql';
import { UserType } from '../../user/dto/user.type';

@ObjectType()
export class AuthResponse {
  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;

  @Field(() => UserType)
  user: UserType;
}
