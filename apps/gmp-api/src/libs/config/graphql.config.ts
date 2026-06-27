import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { registerEnumType } from '@nestjs/graphql';
import { AgencyStatus, AgencyVerificationStatus } from '../enums/agency.enum';
import { ServiceStatus, ServiceType, ServiceVisibility } from '../enums/service.enum';
import { ApplicationStatus, ApplicationPriority, PaymentStatus } from '../enums/application.enum';
import { SubscriptionStatus, BillingCycle, PlanStatus, SupportLevel } from '../enums/subscription.enum';
import { ReviewStatus } from '../enums/review.enum';
import { UserRole, UserStatus } from '../enums/user.enum';
import { ConversationStatus } from '../enums/messaging.enum';
import { Direction, AgencyInquirySort, ServiceInquirySort } from '../enums/inquiry.enum';
import { NotificationType } from '../enums/notification.enum';
import { LikeTargetType, ViewTargetType } from '../enums/like-view.enum';
import { Lang } from '../enums/lang.enum';

registerEnumType(Lang, { name: 'Lang' });
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

registerEnumType(Direction, { name: 'Direction' });
registerEnumType(AgencyInquirySort, { name: 'AgencyInquirySort' });
registerEnumType(ServiceInquirySort, { name: 'ServiceInquirySort' });

registerEnumType(NotificationType, { name: 'NotificationType' });

registerEnumType(LikeTargetType, { name: 'LikeTargetType' });
registerEnumType(ViewTargetType, { name: 'ViewTargetType' });

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
