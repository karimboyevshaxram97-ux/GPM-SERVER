import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { registerEnumType } from '@nestjs/graphql';
import {
  AgencyStatus,
  AgencyVerificationStatus,
  SubscriptionStatus,
  ServiceStatus,
  ServiceType,
  ServiceVisibility,
  ApplicationStatus,
  ApplicationPriority,
  PaymentStatus,
  BillingCycle,
  PlanStatus,
  SupportLevel,
} from '../enums/domain.enum';
import { ReviewStatus } from '../enums/review.enum';
import { UserRole, UserStatus } from '../enums/user.enum';
import { ConversationStatus } from '../enums/messaging.enum';

registerEnumType(UserRole, { name: 'UserRole' });
registerEnumType(UserStatus, { name: 'UserStatus' });

registerEnumType(AgencyStatus, { name: 'AgencyStatus' });
registerEnumType(AgencyVerificationStatus, { name: 'AgencyVerificationStatus' });
registerEnumType(SubscriptionStatus, { name: 'SubscriptionStatus' });

registerEnumType(ServiceType, { name: 'ServiceType' });
registerEnumType(ServiceStatus, { name: 'ServiceStatus' });
registerEnumType(ServiceVisibility, { name: 'ServiceVisibility' });

registerEnumType(ApplicationStatus, { name: 'ApplicationStatus' });
registerEnumType(ApplicationPriority, { name: 'ApplicationPriority' });
registerEnumType(PaymentStatus, { name: 'PaymentStatus' });

registerEnumType(ReviewStatus, { name: 'ReviewStatus' });

registerEnumType(ConversationStatus, { name: 'ConversationStatus' });

registerEnumType(BillingCycle, { name: 'BillingCycle' });
registerEnumType(PlanStatus, { name: 'PlanStatus' });
registerEnumType(SupportLevel, { name: 'SupportLevel' });

export const graphqlConfig: ApolloDriverConfig = {
  driver: ApolloDriver,
  autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
  debug: process.env.NODE_ENV !== 'production',
  playground: process.env.NODE_ENV !== 'production',
  context: ({ req }) => ({ req }),
  csrfPrevention: process.env.NODE_ENV === 'production',
  formatError: (error) => {
    return {
      message: error.message,
      code: error.extensions?.code,
      statusCode: error.extensions?.statusCode,
    };
  },
};
