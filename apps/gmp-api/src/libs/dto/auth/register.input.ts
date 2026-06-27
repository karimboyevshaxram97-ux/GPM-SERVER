import { InputType, Field } from '@nestjs/graphql';
import { IsString, MinLength, IsOptional, IsIn } from 'class-validator';
import { UserRole } from '../../enums/user.enum';

@InputType()
export class RegisterInput {
  @Field()
  @IsString()
  phoneNumber: string;

  @Field()
  @IsString()
  @MinLength(8)
  password: string;

  @Field()
  @IsString()
  firstName: string;

  @Field()
  @IsString()
  lastName: string;

  @Field(() => UserRole, { nullable: true })
  @IsOptional()
  @IsIn([UserRole.USER, UserRole.AGENCY_ADMIN])
  role?: UserRole;
}
