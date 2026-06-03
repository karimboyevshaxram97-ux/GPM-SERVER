import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { registerEnumType } from '@nestjs/graphql';
import {
  AgencyStatus,
  AgencyVerificationStatus,
  SubscriptionStatus,
  ServiceStatus,
  ServiceType,
  ApplicationStatus,
  PaymentStatus,
  ReviewStatus,
  UserRole,
  UserStatus,
} from '../common/enums';

registerEnumType(UserRole, {
  name: 'UserRole',
});

registerEnumType(UserStatus, {
  name: 'UserStatus',
});

registerEnumType(AgencyStatus, {
  name: 'AgencyStatus',
});

registerEnumType(AgencyVerificationStatus, {
  name: 'AgencyVerificationStatus',
});

registerEnumType(SubscriptionStatus, {
  name: 'SubscriptionStatus',
});

registerEnumType(ServiceStatus, {
  name: 'ServiceStatus',
});

registerEnumType(ServiceType, {
  name: 'ServiceType',
});

registerEnumType(ApplicationStatus, {
  name: 'ApplicationStatus',
});

registerEnumType(PaymentStatus, {
  name: 'PaymentStatus',
});

registerEnumType(ReviewStatus, {
  name: 'ReviewStatus',
});

export const graphqlConfig: ApolloDriverConfig = {
  driver: ApolloDriver,
  autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
  debug: process.env.NODE_ENV !== 'production',
  playground: process.env.NODE_ENV !== 'production',
  context: ({ req }) => ({ req }),
  formatError: (error) => {
    return {
      message: error.message,
      code: error.extensions?.code,
      statusCode: error.extensions?.statusCode,
    };
  },
};
