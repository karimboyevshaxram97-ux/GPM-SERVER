# GMP (Global Mobility Platform) - Backend Architecture Design

**Document Version:** 1.0  
**Date:** May 31, 2026  
**Status:** Architecture Design Phase (Pre-Implementation)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Recommended Project Folder Structure](#recommended-project-folder-structure)
3. [NestJS Module Architecture](#nestjs-module-architecture)
4. [Core Entities & Domain Models](#core-entities--domain-models)
5. [Entity Relationships Diagram](#entity-relationships-diagram)
6. [Enum Definitions](#enum-definitions)
7. [Development Phases](#development-phases)
8. [Future Scalability Considerations](#future-scalability-considerations)

---

## Project Overview

### Platform Purpose

GMP is a B2B marketplace connecting international agencies (service providers) with users seeking services related to:

- Study Abroad
- Work Abroad
- Travel
- Visa Services

### Key Business Constraints

- Agencies pay monthly subscription to be listed
- Services are the core search entity, not agencies
- One agency can provide services in multiple countries
- Platform must support role-based access (USER, AGENCY_ADMIN, SUPER_ADMIN)
- Real-time communication via WebSocket
- Production-grade scalability required

### Technology Stack

- **Framework:** NestJS (TypeScript)
- **API:** GraphQL + Apollo Server
- **Database:** MongoDB + Mongoose
- **Authentication:** JWT
- **Real-time:** WebSocket
- **Message Queue:** (Future) RabbitMQ/Bull

---

## Recommended Project Folder Structure

```
gmp-server/
│
├── src/
│   ├── common/
│   │   ├── constants/
│   │   │   ├── app.constant.ts
│   │   │   ├── error.constant.ts
│   │   │   ├── pagination.constant.ts
│   │   │   └── validation.constant.ts
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   └── public.decorator.ts
│   │   ├── exceptions/
│   │   │   ├── custom-exception.ts
│   │   │   ├── business-logic-exception.ts
│   │   │   └── validation-exception.ts
│   │   ├── filters/
│   │   │   ├── graphql-exception.filter.ts
│   │   │   └── all-exceptions.filter.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   ├── gql-auth.guard.ts
│   │   │   └── gql-roles.guard.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   ├── transform.interceptor.ts
│   │   │   └── timeout.interceptor.ts
│   │   ├── pipes/
│   │   │   ├── validation.pipe.ts
│   │   │   ├── parse-mongo-id.pipe.ts
│   │   │   └── pagination.pipe.ts
│   │   ├── scalars/
│   │   │   ├── date.scalar.ts
│   │   │   ├── json.scalar.ts
│   │   │   └── object-id.scalar.ts
│   │   └── utils/
│   │       ├── pagination.util.ts
│   │       ├── encryption.util.ts
│   │       ├── validation.util.ts
│   │       └── slug.util.ts
│   │
│   ├── modules/
│   │   │
│   │   ├── auth/
│   │   │   ├── dto/
│   │   │   │   ├── login.input.ts
│   │   │   │   ├── register.input.ts
│   │   │   │   ├── refresh-token.input.ts
│   │   │   │   └── auth-response.type.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   ├── jwt-refresh.strategy.ts
│   │   │   │   └── local.strategy.ts
│   │   │   ├── auth.resolver.ts
│   │   │   └── auth.module.ts
│   │   │
│   │   ├── user/
│   │   │   ├── schemas/
│   │   │   │   └── user.schema.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-user.input.ts
│   │   │   │   ├── update-user.input.ts
│   │   │   │   ├── user-filter.input.ts
│   │   │   │   └── user.type.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.resolver.ts
│   │   │   └── user.module.ts
│   │   │
│   │   ├── agency/
│   │   │   ├── schemas/
│   │   │   │   └── agency.schema.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-agency.input.ts
│   │   │   │   ├── update-agency.input.ts
│   │   │   │   ├── agency-filter.input.ts
│   │   │   │   └── agency.type.ts
│   │   │   ├── agency.service.ts
│   │   │   ├── agency.resolver.ts
│   │   │   └── agency.module.ts
│   │   │
│   │   ├── service/
│   │   │   ├── schemas/
│   │   │   │   └── service.schema.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-service.input.ts
│   │   │   │   ├── update-service.input.ts
│   │   │   │   ├── service-filter.input.ts
│   │   │   │   └── service.type.ts
│   │   │   ├── service.service.ts
│   │   │   ├── service.resolver.ts
│   │   │   └── service.module.ts
│   │   │
│   │   ├── application/
│   │   │   ├── schemas/
│   │   │   │   └── application.schema.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-application.input.ts
│   │   │   │   ├── update-application.input.ts
│   │   │   │   ├── application-filter.input.ts
│   │   │   │   └── application.type.ts
│   │   │   ├── application.service.ts
│   │   │   ├── application.resolver.ts
│   │   │   └── application.module.ts
│   │   │
│   │   ├── review/
│   │   │   ├── schemas/
│   │   │   │   └── review.schema.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-review.input.ts
│   │   │   │   ├── update-review.input.ts
│   │   │   │   ├── review-filter.input.ts
│   │   │   │   └── review.type.ts
│   │   │   ├── review.service.ts
│   │   │   ├── review.resolver.ts
│   │   │   └── review.module.ts
│   │   │
│   │   ├── follow/
│   │   │   ├── schemas/
│   │   │   │   └── follow.schema.ts
│   │   │   ├── dto/
│   │   │   │   ├── follow.input.ts
│   │   │   │   └── follow.type.ts
│   │   │   ├── follow.service.ts
│   │   │   ├── follow.resolver.ts
│   │   │   └── follow.module.ts
│   │   │
│   │   ├── messaging/
│   │   │   ├── schemas/
│   │   │   │   ├── message.schema.ts
│   │   │   │   └── conversation.schema.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-message.input.ts
│   │   │   │   ├── conversation-filter.input.ts
│   │   │   │   ├── message.type.ts
│   │   │   │   └── conversation.type.ts
│   │   │   ├── messaging.service.ts
│   │   │   ├── messaging.resolver.ts
│   │   │   ├── messaging.gateway.ts
│   │   │   └── messaging.module.ts
│   │   │
│   │   ├── country/
│   │   │   ├── schemas/
│   │   │   │   └── country.schema.ts
│   │   │   ├── dto/
│   │   │   │   ├── country-filter.input.ts
│   │   │   │   └── country.type.ts
│   │   │   ├── country.service.ts
│   │   │   ├── country.resolver.ts
│   │   │   └── country.module.ts
│   │   │
│   │   ├── subscription/
│   │   │   ├── schemas/
│   │   │   │   ├── subscription-plan.schema.ts
│   │   │   │   └── agency-subscription.schema.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-subscription-plan.input.ts
│   │   │   │   ├── subscribe-to-plan.input.ts
│   │   │   │   ├── subscription-plan.type.ts
│   │   │   │   └── agency-subscription.type.ts
│   │   │   ├── subscription.service.ts
│   │   │   ├── subscription.resolver.ts
│   │   │   └── subscription.module.ts
│   │   │
│   │   ├── analytics/
│   │   │   ├── schemas/
│   │   │   │   ├── agency-stat.schema.ts
│   │   │   │   └── service-stat.schema.ts
│   │   │   ├── dto/
│   │   │   │   ├── agency-stat.type.ts
│   │   │   │   ├── service-stat.type.ts
│   │   │   │   └── analytics-filter.input.ts
│   │   │   ├── analytics.service.ts
│   │   │   ├── analytics.resolver.ts
│   │   │   └── analytics.module.ts
│   │   │
│   │   └── admin/
│   │       ├── dto/
│   │       │   ├── approve-agency.input.ts
│   │       │   ├── platform-stat.type.ts
│   │       │   └── admin-filter.input.ts
│   │       ├── admin.service.ts
│   │       ├── admin.resolver.ts
│   │       └── admin.module.ts
│   │
│   ├── config/
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   ├── graphql.config.ts
│   │   ├── websocket.config.ts
│   │   └── validation.schema.ts
│   │
│   ├── database/
│   │   ├── seeders/
│   │   │   ├── country.seeder.ts
│   │   │   ├── subscription-plan.seeder.ts
│   │   │   └── admin.seeder.ts
│   │   └── migrations/
│   │       └── (for future MongoDB migrations if needed)
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── test/
│   ├── unit/
│   │   ├── user/
│   │   ├── service/
│   │   └── ...
│   └── e2e/
│       ├── auth.e2e.spec.ts
│       ├── service.e2e.spec.ts
│       └── ...
│
├── .env.example
├── .env.local
├── .env.development
├── .env.production
├── .eslintrc.js
├── .prettierrc
├── tsconfig.json
├── package.json
├── docker-compose.yml
├── Dockerfile
└── README.md
```

---

## NestJS Module Architecture

### Module Dependency Graph

```
AppModule
│
├── ConfigModule (Global)
├── MongooseModule (Global)
├── JwtModule (Global)
├── GraphQLModule (Global)
│
├── AuthModule
│   └── depends on: UserModule
│
├── UserModule
│   └── depends on: FollowModule
│
├── AgencyModule
│   └── depends on: SubscriptionModule, CountryModule
│
├── ServiceModule
│   ├── depends on: AgencyModule, CountryModule, ReviewModule
│   └── provides: Service Query for Users
│
├── ApplicationModule
│   ├── depends on: UserModule, ServiceModule
│   └── provides: User <-> Agency interaction
│
├── ReviewModule
│   ├── depends on: UserModule, AgencyModule, ApplicationModule
│   └── provides: Review logic
│
├── FollowModule
│   ├── depends on: UserModule, AgencyModule
│   └── provides: User follows Agency
│
├── MessagingModule
│   ├── depends on: UserModule, AgencyModule
│   ├── provides: WebSocket Gateway
│   └── provides: Real-time messaging
│
├── CountryModule
│   └── provides: Lookup data for Services
│
├── SubscriptionModule
│   ├── depends on: AgencyModule
│   └── provides: Billing logic
│
├── AnalyticsModule
│   ├── depends on: AgencyModule, ServiceModule, ApplicationModule
│   └── provides: Stats & metrics
│
└── AdminModule
    ├── depends on: AgencyModule, SubscriptionModule, AnalyticsModule
    └── provides: Platform management
```

### Module Descriptions

| Module                 | Purpose                 | Key Responsibilities                                          |
| ---------------------- | ----------------------- | ------------------------------------------------------------- |
| **AuthModule**         | User authentication     | Login, register, JWT token management, password reset         |
| **UserModule**         | User profile management | User profile CRUD, preferences, activity tracking             |
| **AgencyModule**       | Agency management       | Agency profile, team members, agency verification             |
| **ServiceModule**      | Core service offerings  | Create/update/delete services, search, filtering, discovery   |
| **ApplicationModule**  | User applications       | User applications to services, status tracking, communication |
| **ReviewModule**       | User reviews & ratings  | Create reviews, rating system, review moderation              |
| **FollowModule**       | User follows agency     | Follow/unfollow, notifications, follow lists                  |
| **MessagingModule**    | Real-time communication | Messages, conversations, WebSocket connections, notifications |
| **CountryModule**      | Country lookup          | Countries list, flags, codes (seeded data)                    |
| **SubscriptionModule** | Billing & subscriptions | Subscription plans, agency subscriptions, payment tracking    |
| **AnalyticsModule**    | Metrics & reporting     | Agency stats, service stats, platform analytics               |
| **AdminModule**        | Platform administration | Agency approval, subscription management, platform moderation |

---

## Core Entities & Domain Models

### 1. **User Entity**

```
User {
  _id: ObjectId
  firstName: string (required)
  lastName: string (required)
  email: string (required, unique)
  phoneNumber: string
  password: string (hashed)
  avatar: string (URL)
  bio: string
  dateOfBirth: Date
  nationality: string (Country ID reference)
  status: UserStatus (ACTIVE, INACTIVE, BANNED)
  emailVerified: boolean
  role: UserRole (USER only)
  createdAt: Date
  updatedAt: Date
  lastLoginAt: Date

  // Relations
  applications: [Application] (populated on demand)
  reviews: [Review] (populated on demand)
  followingAgencies: [Agency] (populated on demand)
  conversations: [Conversation] (populated on demand)
}
```

### 2. **Agency Entity**

```
Agency {
  _id: ObjectId
  name: string (required, unique)
  slug: string (required, unique)
  email: string (required)
  phoneNumber: string
  website: string
  logo: string (URL)
  banner: string (URL)
  description: string (detailed)
  foundedYear: number

  // Verification & Status
  verificationStatus: AgencyVerificationStatus (PENDING, VERIFIED, REJECTED)
  verificationDate: Date
  verificationDocuments: [string] (URLs)

  // Location & Coverage
  headofficeCountry: Country (reference)
  operatingCountries: [Country] (reference)
  offices: [AgencyOffice]
    - country: Country
    - city: string
    - address: string
    - phoneNumber: string

  // Subscription
  activeSubscription: AgencySubscription (reference)
  subscriptionStatus: SubscriptionStatus (ACTIVE, EXPIRED, CANCELLED)

  // Team
  teamSize: number
  adminTeamMembers: [User] (AGENCY_ADMIN role)

  // Statistics
  totalServices: number
  totalApplications: number
  averageRating: number (0-5)
  totalReviews: number
  totalFollowers: number

  // Metadata
  socialLinks: SocialLinks
  certifications: [string]
  tags: [string]

  status: AgencyStatus (ACTIVE, INACTIVE, SUSPENDED)
  createdAt: Date
  updatedAt: Date

  // Relations
  services: [Service] (populated on demand)
  reviews: [Review] (populated on demand)
  applications: [Application] (populated on demand)
  followers: [User] (populated on demand)
  subscriptions: [AgencySubscription] (populated on demand)
}
```

### 3. **Service Entity** ⭐ **CORE**

```
Service {
  _id: ObjectId
  name: string (required)
  slug: string (required, unique)
  description: string (detailed)

  // Service Category & Type
  serviceType: ServiceType (STUDY_ABROAD, WORK_ABROAD, TRAVEL, VISA_SERVICES)
  destinationCountry: Country (reference, required)

  // Optional for some services
  sourceCountries: [Country] (countries from which service accepts applicants)

  // Pricing
  basePrice: number (in USD)
  currency: string (default: USD)
  priceBreakdown: PriceBreakdown
    - processingFee: number
    - agencyFee: number
    - serviceTax: number

  // Service Details
  duration: string (e.g., "3-6 months", "1 year")
  capacity: number (max applicants)
  currentApplicationCount: number

  // Requirements
  minimumQualifications: [string]
  requiredDocuments: [string]

  // Timeline
  applicationDeadline: Date
  startDate: Date
  endDate: Date

  // Media
  images: [string] (URLs)
  videos: [string] (URLs)

  // Benefits
  benefits: [string]
  highlights: [string]

  // SEO & Visibility
  tags: [string] (for filtering/search)
  keywords: [string] (for full-text search)
  visibility: ServiceVisibility (PUBLIC, AGENCY_ONLY, ARCHIVED)

  // Ratings
  averageRating: number (0-5)
  totalReviews: number
  totalApplications: number

  // Agency Reference
  agency: Agency (reference, required)

  status: ServiceStatus (ACTIVE, DRAFT, ARCHIVED, SUSPENDED)
  createdAt: Date
  updatedAt: Date
  publishedAt: Date

  // Relations
  applications: [Application] (populated on demand)
  reviews: [Review] (populated on demand)
}
```

### 4. **Application Entity**

```
Application {
  _id: ObjectId

  // References
  service: Service (reference, required)
  agency: Agency (denormalized for efficiency)
  user: User (reference, required)

  // Status
  status: ApplicationStatus (SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, ACCEPTED, COMPLETED, WITHDRAWN)

  // Submission Details
  applicationData: JSON (dynamic, based on service requirements)
  documents: [Document]
    - name: string
    - url: string
    - uploadedAt: Date
    - verified: boolean

  // Communication
  conversationId: Conversation (reference)
  notes: [ApplicationNote]
    - author: User
    - text: string
    - createdAt: Date

  // Pricing
  totalPrice: number
  paymentStatus: PaymentStatus (PENDING, COMPLETED, REFUNDED)

  // Timeline
  appliedAt: Date
  reviewStartedAt: Date
  reviewCompletedAt: Date
  responseDeadline: Date

  // Additional
  priority: ApplicationPriority (LOW, MEDIUM, HIGH)
  tags: [string]

  createdAt: Date
  updatedAt: Date

  // Relations
  reviews: [Review] (user reviews of application/agency after completion)
}
```

### 5. **Review Entity**

```
Review {
  _id: ObjectId

  // References
  agency: Agency (reference, required)
  service: Service (reference, required)
  user: User (reference, required)
  application: Application (reference, optional - link to application that triggered review)

  // Rating
  rating: number (1-5, required)

  // Content
  title: string
  description: string

  // Detailed Ratings (breakdown)
  categories: ReviewCategory[]
    - name: string (e.g., "Communication", "Process", "Outcome", "Value")
    - rating: number (1-5)

  // Verification
  isVerified: boolean (user completed this service)
  verificationProof: Application (reference)

  // Moderation
  status: ReviewStatus (PENDING, APPROVED, REJECTED, HIDDEN)
  moderationNotes: string
  moderatedBy: User (SUPER_ADMIN reference)
  moderatedAt: Date

  // Engagement
  helpful: number (count of helpful votes)
  unhelpful: number (count of unhelpful votes)

  images: [string] (URLs)

  createdAt: Date
  updatedAt: Date

  // Relations
  replies: [ReviewReply] (agency replies to reviews)
}
```

### 6. **Follow Entity**

```
Follow {
  _id: ObjectId

  // References
  user: User (reference, required)
  agency: Agency (reference, required)

  // Metadata
  followedAt: Date
  notificationsEnabled: boolean (default: true)

  createdAt: Date

  // Indexes: unique(user, agency)
}
```

### 7. **Message & Conversation Entities**

```
Conversation {
  _id: ObjectId

  // Participants
  participants: [User] (references, min 2, max 2 for now)
  agency: Agency (reference for agency side)

  // Last Message
  lastMessage: Message (denormalized for performance)
  lastMessageAt: Date
  unreadCountByUser: {
    [userId]: number
  }

  // Status
  status: ConversationStatus (ACTIVE, ARCHIVED, BLOCKED)
  blockedBy: User (reference, if blocked)

  createdAt: Date
  updatedAt: Date
}

Message {
  _id: ObjectId

  // References
  conversation: Conversation (reference, required)
  sender: User (reference, required)

  // Content
  text: string
  attachments: [Attachment]
    - url: string
    - type: string (image, file, document)
    - name: string

  // Status
  isRead: boolean
  isEdited: boolean
  editedAt: Date

  createdAt: Date
  updatedAt: Date
}
```

### 8. **Country Entity** (Reference/Lookup)

```
Country {
  _id: ObjectId

  name: string (required, unique)
  code: string (ISO 3166-1 alpha-2, required, unique)
  code3: string (ISO 3166-1 alpha-3)
  isoNumeric: number
  region: string
  subregion: string
  flag: string (emoji)
  flagUrl: string

  isActive: boolean (default: true)

  createdAt: Date
  updatedAt: Date
}
```

### 9. **SubscriptionPlan Entity**

```
SubscriptionPlan {
  _id: ObjectId

  name: string (required, unique)
  slug: string (required, unique)
  description: string

  // Pricing
  monthlyPrice: number (in USD)
  annualPrice: number (in USD)
  currency: string (default: USD)

  // Features
  features: SubscriptionFeature[]
    - name: string
    - included: boolean
    - limit: number (optional)

  maxServices: number
  maxTeamMembers: number
  maxApplicationsPerMonth: number

  // Support
  supportLevel: SupportLevel (BASIC, STANDARD, PREMIUM)

  // Visibility
  isPublic: boolean (visible to agencies)
  displayOrder: number

  status: PlanStatus (ACTIVE, ARCHIVED)
  createdAt: Date
  updatedAt: Date
}

AgencySubscription {
  _id: ObjectId

  // References
  agency: Agency (reference, required)
  plan: SubscriptionPlan (reference, required)

  // Billing
  status: SubscriptionStatus (ACTIVE, EXPIRED, CANCELLED, SUSPENDED)
  stripeSubscriptionId: string (for Stripe integration)

  // Dates
  startDate: Date (required)
  endDate: Date (required)
  renewalDate: Date
  cancelledAt: Date

  // Billing Info
  billingCycle: BillingCycle (MONTHLY, ANNUAL)
  autoRenew: boolean (default: true)

  // Payment History
  paymentHistory: [Payment]
    - amount: number
    - status: PaymentStatus
    - paidAt: Date
    - receiptUrl: string

  createdAt: Date
  updatedAt: Date
}
```

### 10. **Analytics Entities**

```
AgencyStat {
  _id: ObjectId

  agency: Agency (reference, required)
  date: Date (required)

  // Metrics
  profileViews: number
  applicationCount: number
  averageRating: number
  reviewCount: number
  followerCount: number
  activeServices: number

  createdAt: Date
}

ServiceStat {
  _id: ObjectId

  service: Service (reference, required)
  date: Date (required)

  // Metrics
  views: number
  applicationCount: number
  rating: number
  reviewCount: number

  createdAt: Date
}
```

---

## Entity Relationships Diagram

```
┌─────────────────┐
│     USER        │
├─────────────────┤
│ _id             │
│ firstName       │
│ lastName        │
│ email           │
│ password        │
│ role: USER      │
│ ...             │
└────────┬────────┘
         │
         ├─────────────┬───────────────┬──────────────┐
         │             │               │              │
         │             ▼               ▼              ▼
         │      ┌─────────────────┐ ┌──────────┐ ┌─────────┐
         │      │  APPLICATION    │ │  REVIEW  │ │ FOLLOW  │
         │      └─────────────────┘ └──────────┘ └─────────┘
         │             │                 │            │
         │             └────────┬────────┘            │
         │                      │                     │
         └──────────────────────┼─────────────────────┘
                                │
                                ▼
                      ┌──────────────────┐
                      │     AGENCY       │
                      ├──────────────────┤
                      │ _id              │
                      │ name             │
                      │ email            │
                      │ subscription     │◄──────┐
                      │ operatingCountries      │
                      │ ...              │      │
                      └────────┬─────────┘      │
                               │                │
                        ┌──────┴──────┐         │
                        ▼             ▼         │
                  ┌──────────┐  ┌──────────────────┐
                  │ SERVICE  │  │AGENCY_SUBSCRIPTION
                  ├──────────┤  ├──────────────────┤
                  │ _id      │  │ agency       ◄───┘
                  │ name     │  │ plan         ──┐
                  │ agency◄──┼─►│ status       │ │
                  │ service  │  │ startDate    │ │
                  │ type     │  │ endDate      │ │
                  │ destCountry  │ ...        │ │
                  │ ...      │  └──────────────┘ │
                  └────┬─────┘                    │
                       │                          │
                       ▼                          │
                ┌───────────────┐                 │
                │ CONVERSATION  │                 │
                ├───────────────┤                 │
                │ participants  │                 │
                │ lastMessage   │                 │
                │ ...           │                 │
                └────┬──────────┘                 │
                     │                            │
                     ▼                            │
                ┌──────────┐                      │
                │ MESSAGE  │                      │
                ├──────────┤                      │
                │ sender   │                      │
                │ text     │                      │
                │ ...      │                      │
                └──────────┘                      │
                                                   │
                     ┌────────────────────────────┘
                     ▼
            ┌──────────────────┐
            │SUBSCRIPTION_PLAN │
            ├──────────────────┤
            │ name             │
            │ monthlyPrice     │
            │ features         │
            │ ...              │
            └──────────────────┘

┌──────────────────┐
│    COUNTRY       │◄────┐ (Reference for multiple fields)
├──────────────────┤     │
│ _id              │     │
│ name             │     │
│ code             │     │
│ flag             │     │
│ ...              │     │
└──────────────────┘     │
                          └──(Used by User, Agency, Service)

┌──────────────────┐
│   ANALYTICS      │
├──────────────────┤
│ AgencyStat       │──► Agency
│ ServiceStat      │──► Service
│ Date             │
│ Metrics          │
└──────────────────┘
```

---

## Enum Definitions

### User-Related Enums

```typescript
enum UserRole {
  USER = "USER",
  AGENCY_ADMIN = "AGENCY_ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
}

enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BANNED = "BANNED",
}
```

### Agency-Related Enums

```typescript
enum AgencyVerificationStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
}

enum AgencyStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}
```

### Service-Related Enums

```typescript
enum ServiceType {
  STUDY_ABROAD = "STUDY_ABROAD",
  WORK_ABROAD = "WORK_ABROAD",
  TRAVEL = "TRAVEL",
  VISA_SERVICES = "VISA_SERVICES",
}

enum ServiceStatus {
  ACTIVE = "ACTIVE",
  DRAFT = "DRAFT",
  ARCHIVED = "ARCHIVED",
  SUSPENDED = "SUSPENDED",
}

enum ServiceVisibility {
  PUBLIC = "PUBLIC",
  AGENCY_ONLY = "AGENCY_ONLY",
  ARCHIVED = "ARCHIVED",
}
```

### Application-Related Enums

```typescript
enum ApplicationStatus {
  SUBMITTED = "SUBMITTED",
  UNDER_REVIEW = "UNDER_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  ACCEPTED = "ACCEPTED",
  COMPLETED = "COMPLETED",
  WITHDRAWN = "WITHDRAWN",
}

enum ApplicationPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  REFUNDED = "REFUNDED",
  FAILED = "FAILED",
}
```

### Review-Related Enums

```typescript
enum ReviewStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  HIDDEN = "HIDDEN",
}
```

### Subscription-Related Enums

```typescript
enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
  SUSPENDED = "SUSPENDED",
}

enum BillingCycle {
  MONTHLY = "MONTHLY",
  ANNUAL = "ANNUAL",
}

enum PlanStatus {
  ACTIVE = "ACTIVE",
  ARCHIVED = "ARCHIVED",
}

enum SupportLevel {
  BASIC = "BASIC",
  STANDARD = "STANDARD",
  PREMIUM = "PREMIUM",
}
```

### Conversation-Related Enums

```typescript
enum ConversationStatus {
  ACTIVE = "ACTIVE",
  ARCHIVED = "ARCHIVED",
  BLOCKED = "BLOCKED",
}
```

---

## Development Phases

### **Phase 1: Foundation & Core Infrastructure** (Weeks 1-4)

**Objective:** Establish the basic project structure and authentication system.

**Tasks:**

- [ ] Initialize NestJS project with TypeScript
- [ ] Configure MongoDB connection and Mongoose setup
- [ ] Set up GraphQL schema and Apollo Server
- [ ] Implement JWT authentication (login, register)
- [ ] Create common utilities: guards, decorators, pipes, filters
- [ ] Set up environment configuration (dev, staging, production)
- [ ] Configure logging and error handling
- [ ] Create basic seed data (countries, subscription plans)

**Deliverables:**

- Project structure ready
- Authentication system working (JWT)
- Seeded database with lookup data
- Error handling middleware implemented

---

### **Phase 2: User & Agency Management** (Weeks 5-8)

**Objective:** Build user and agency profile systems.

**Tasks:**

- [ ] Implement User module (CRUD, profile management)
- [ ] Implement Agency module (CRUD, verification workflow)
- [ ] Add role-based access control (USER vs AGENCY_ADMIN)
- [ ] Create admin approval workflow for agencies
- [ ] Add email verification system
- [ ] Create user-agency relationship endpoints
- [ ] Implement pagination and filtering
- [ ] Add GraphQL queries for user/agency discovery

**Deliverables:**

- User module complete and tested
- Agency module complete and tested
- Role-based access control working
- Admin approval workflow functional

---

### **Phase 3: Service Management** (Weeks 9-12)

**Objective:** Build the core service marketplace functionality.

**Tasks:**

- [ ] Implement Service module (CRUD)
- [ ] Add service filtering (by country, type, agency)
- [ ] Implement full-text search for services
- [ ] Add service visibility controls (PUBLIC/DRAFT/ARCHIVED)
- [ ] Create service-related DTOs and types
- [ ] Implement service statistics and metrics collection
- [ ] Add image upload for services
- [ ] Create service recommendations/suggestions

**Deliverables:**

- Service discovery & search fully functional
- Service CRUD working
- Analytics collection started
- Full-text search implemented

---

### **Phase 4: Application System** (Weeks 13-16)

**Objective:** Build user application workflow.

**Tasks:**

- [ ] Implement Application module (CRUD)
- [ ] Create dynamic application form builder
- [ ] Implement application status workflow (SUBMITTED → COMPLETED)
- [ ] Add document upload for applications
- [ ] Create application timeline tracking
- [ ] Implement agency application review workflow
- [ ] Add application notifications
- [ ] Create application filtering and search for agencies

**Deliverables:**

- Application workflow complete
- Document upload working
- Status transitions functioning
- Notifications sending

---

### **Phase 5: Reviews & Ratings** (Weeks 17-20)

**Objective:** Build review and rating system.

**Tasks:**

- [ ] Implement Review module
- [ ] Create review moderation system
- [ ] Implement rating calculation (average, by category)
- [ ] Add review verification (must complete application)
- [ ] Create review helpful/unhelpful voting
- [ ] Implement agency review replies
- [ ] Add review filtering and sorting
- [ ] Create review analytics

**Deliverables:**

- Review system complete
- Moderation workflow working
- Rating calculations accurate
- Analytics functional

---

### **Phase 6: Messaging & Real-Time Communication** (Weeks 21-24)

**Objective:** Build real-time messaging system.

**Tasks:**

- [ ] Implement Messaging module
- [ ] Create WebSocket gateway for real-time messages
- [ ] Implement conversation management
- [ ] Add message history and pagination
- [ ] Create notification system for new messages
- [ ] Implement typing indicators
- [ ] Add message read/unread status
- [ ] Create conversation blocking feature

**Deliverables:**

- WebSocket gateway working
- Real-time messaging functional
- Message history retrievable
- Notifications working

---

### **Phase 7: Follow System** (Weeks 25-26)

**Objective:** Add user follow functionality.

**Tasks:**

- [ ] Implement Follow module
- [ ] Create follow/unfollow operations
- [ ] Add follower/following lists
- [ ] Implement follow notifications
- [ ] Add follow-related filters
- [ ] Create aggregations for recommendations

**Deliverables:**

- Follow system complete
- Notifications integrated
- Aggregations working

---

### **Phase 8: Subscription & Billing** (Weeks 27-30)

**Objective:** Build subscription management system.

**Tasks:**

- [ ] Implement Subscription module
- [ ] Create subscription plan management (for SUPER_ADMIN)
- [ ] Integrate Stripe payment (or similar)
- [ ] Implement agency subscription workflow
- [ ] Create billing history and invoices
- [ ] Add subscription status tracking
- [ ] Implement auto-renewal logic
- [ ] Add subscription notifications

**Deliverables:**

- Subscription system complete
- Payment integration working
- Billing history functional
- Notifications operational

---

### **Phase 9: Analytics & Reporting** (Weeks 31-34)

**Objective:** Build analytics and admin dashboard functionality.

**Tasks:**

- [ ] Implement Analytics module
- [ ] Create agency statistics tracking
- [ ] Create service statistics tracking
- [ ] Build platform-wide metrics
- [ ] Create dashboard queries for admins
- [ ] Implement reporting APIs
- [ ] Add time-series analytics
- [ ] Create data export functionality

**Deliverables:**

- Analytics module complete
- Dashboard queries working
- Reports functional
- Data export working

---

### **Phase 10: Admin Features & Moderation** (Weeks 35-38)

**Objective:** Build admin control features.

**Tasks:**

- [ ] Implement Admin module
- [ ] Create platform moderation tools
- [ ] Add user/agency suspension/banning
- [ ] Create content moderation workflows
- [ ] Implement audit logging
- [ ] Add admin activity tracking
- [ ] Create admin dashboards and reports
- [ ] Add permission management for admins

**Deliverables:**

- Admin module complete
- Moderation tools functional
- Audit logging working
- Admin dashboards operational

---

### **Phase 11: Testing & Optimization** (Weeks 39-42)

**Objective:** Test, optimize, and prepare for production.

**Tasks:**

- [ ] Write unit tests (80%+ coverage)
- [ ] Write E2E tests for critical workflows
- [ ] Performance testing and optimization
- [ ] Database indexing optimization
- [ ] Query optimization
- [ ] Load testing
- [ ] Security audit
- [ ] API documentation (using GraphQL documentation)

**Deliverables:**

- High test coverage
- Performance benchmarks met
- Security issues resolved
- Documentation complete

---

### **Phase 12: Deployment & Launch** (Weeks 43-44)

**Objective:** Deploy to production.

**Tasks:**

- [ ] Set up production MongoDB
- [ ] Set up production server infrastructure
- [ ] Configure CI/CD pipeline
- [ ] Implement monitoring and alerting
- [ ] Set up logging infrastructure
- [ ] Create disaster recovery plan
- [ ] Final production testing
- [ ] Launch!

**Deliverables:**

- Production deployment successful
- Monitoring and alerts working
- Logging operational
- Disaster recovery tested

---

## Future Scalability Considerations

### 1. **Database Scalability**

#### MongoDB Sharding Strategy

```
Shard Key Design:
- Services: { serviceType: 1, destinationCountry: 1 }
  (Even distribution across service types and countries)

- Applications: { agency: 1, createdAt: 1 }
  (Distributes by agency, time-based)

- Reviews: { agency: 1, createdAt: 1 }
  (Similar to applications)
```

#### Collection-Level Optimizations

- **Time-Series Collections:** For `AgencyStat` and `ServiceStat` to reduce storage
- **Capped Collections:** For activity logs
- **Partitioning:** By date for `Message` (monthly collections)
- **Read Replicas:** For analytics queries to avoid impacting main cluster

### 2. **Microservices Architecture** (Future)

```
Current Monolith → Future Microservices:

┌─────────────────────────────────────────────────┐
│          API Gateway (GraphQL Federation)       │
└─────────┬─────────────────────────────────────┐
          │                                       │
    ┌─────▼──────┐  ┌───────────┐  ┌──────────┐
    │ Auth       │  │ User      │  │ Catalog  │
    │ Service    │  │ Service   │  │ Service  │
    └────────────┘  └───────────┘  └──────────┘
         │                │              │
    ┌────▼──────┐  ┌──────▼────┐  ┌──────▼──────┐
    │ Messaging │  │Application│  │Subscription │
    │ Service   │  │ Service   │  │ Service     │
    └───────────┘  └────────────┘  └─────────────┘
         │                │              │
    ┌────▼──────┐  ┌──────▼────┐  ┌──────▼──────┐
    │ Analytics │  │Review      │  │Admin        │
    │ Service   │  │Service     │  │Service      │
    └───────────┘  └────────────┘  └─────────────┘

Inter-Service Communication:
- RabbitMQ or AWS SQS for async events
- gRPC for synchronous calls
- GraphQL Federation for API composition
```

### 3. **Caching Strategy**

```
Multi-Layer Cache:

┌──────────────────────────────────────────┐
│          Application Layer               │
│   (In-memory cache with TTL)             │
└────────────────────┬─────────────────────┘
                     │
┌────────────────────▼─────────────────────┐
│   Redis Cache Layer                      │
│   - Session store                        │
│   - Query result cache                   │
│   - Rate limiting                        │
│   - Real-time notifications              │
└────────────────────┬─────────────────────┘
                     │
┌────────────────────▼─────────────────────┐
│   CDN Layer (for static content)         │
│   - Images, videos                       │
│   - Static files                         │
└──────────────────────────────────────────┘

Cache Invalidation Strategy:
- Event-driven: Invalidate when data changes
- Time-based: TTL for non-critical data
- Manual: Admin override for immediate refresh
```

**Cache Keys Design:**

```
service:{serviceId} → Expires 1 hour
service:list:{filter_hash} → Expires 30 minutes
agency:{agencyId} → Expires 2 hours
user:{userId}:profile → Expires 1 hour
reviews:{entityId}:{page} → Expires 30 minutes
search:cache:{query_hash} → Expires 15 minutes
```

### 4. **Search Infrastructure** (Future)

```
Elasticsearch/OpenSearch Integration:

Current: MongoDB full-text search
Future:
┌──────────────────────────────────┐
│   Elasticsearch/OpenSearch       │
│   - Full-text search             │
│   - Faceted search               │
│   - Aggregations                 │
│   - Ranking by relevance         │
└──────────────────┬───────────────┘
                   │
        ┌──────────▼──────────┐
        │  MongoDB as source  │
        │  of truth           │
        └─────────────────────┘
```

### 5. **Message Queue Architecture**

```
For Background Jobs:

┌─────────────────┐
│  API Request    │
└────────┬────────┘
         │
    ┌────▼──────────┐
    │ RabbitMQ/Bull │
    ├───────────────┤
    │ Queues:       │
    │ - email       │
    │ - sms         │
    │ - notification│
    │ - indexing    │
    │ - reporting   │
    └────┬──────────┘
         │
    ┌────▼──────────────┐
    │  Worker Processes │
    │  (Separate pods)  │
    └───────────────────┘

Priority Levels:
- CRITICAL: User notifications
- HIGH: Email verification
- MEDIUM: Report generation
- LOW: Analytics processing
```

### 6. **Real-Time Infrastructure Scaling**

```
Current: Single WebSocket gateway
Future: Distributed real-time

┌────────────────────────────────────┐
│       Socket.io with Redis         │
│       (Distributed sessions)       │
├────────────────────────────────────┤
│  Namespace Structure:               │
│  /agency/{agencyId}                │
│  /user/{userId}                    │
│  /conversation/{conversationId}    │
└────────────────────────────────────┘
     │         │          │
┌────▼──┐  ┌──▼────┐  ┌──▼────┐
│Pod 1  │  │Pod 2  │  │Pod 3  │
└───────┘  └───────┘  └───────┘
     │         │          │
     └────┬────┴────┬─────┘
          │         │
       ┌──▼────────▼──┐
       │ Redis Adapter │
       └───────────────┘
```

### 7. **API Rate Limiting & Throttling**

```
Per-User/Per-IP Limits:

┌──────────────────────────────────┐
│   Authenticated Users             │
│   - 1000 requests/hour            │
│   - 50 mutations/hour             │
│   - 100 complex queries/hour      │
├──────────────────────────────────┤
│   Guest Users (IP-based)          │
│   - 100 requests/hour             │
│   - 20 mutations/hour             │
│   - 5 complex queries/hour        │
├──────────────────────────────────┤
│   Premium Subscription            │
│   - 5000 requests/hour            │
│   - 200 mutations/hour            │
│   - 500 complex queries/hour      │
└──────────────────────────────────┘

Implementation: Redis + custom interceptor
```

### 8. **Monitoring & Observability**

```
Observability Stack:

┌─────────────────────────────────────────┐
│  Application                            │
│  (Instrumentation)                      │
└──────────┬──────────────────────────────┘
           │
    ┌──────┴──────┐
    │             │
┌───▼────┐   ┌──▼────┐
│Logs    │   │Metrics │
│Datadog │   │  (PM2) │
└────────┘   └────────┘
    │             │
    └──────┬──────┘
           │
    ┌──────▼───────┐
    │ Dashboards   │
    │ Grafana      │
    │ Datadog      │
    └──────────────┘

Key Metrics to Track:
- API response time (p50, p95, p99)
- Error rate by endpoint
- Database query time
- WebSocket connection count
- Message queue depth
- Cache hit ratio
- GraphQL query complexity
```

### 9. **Deployment Strategy**

```
Infrastructure Layout:

┌─────────────────────────────────────────────┐
│         Load Balancer (Nginx)               │
│         (SSL Termination)                   │
└────────────────────┬────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
    ┌───▼────┐   ┌──▼────┐   ┌──▼────┐
    │API Pod │   │API Pod│   │API Pod │
    │(Node 1)│   │(Node 2)   │(Node 3)│
    └────────┘   └────────┘   └───────┘
        │            │            │
        └────────────┼────────────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
┌───▼──────┐    ┌───▼──────┐    ┌──▼───────┐
│ MongoDB  │    │   Redis  │    │WebSocket │
│ Cluster  │    │ Cluster  │    │ Gateway  │
└──────────┘    └──────────┘    └──────────┘

Auto-scaling Policy:
- CPU > 70% → Scale up
- CPU < 20% → Scale down
- Memory > 80% → Alert + scale
- Request queue depth > 1000 → Scale
```

### 10. **Security Considerations at Scale**

```
Multi-Layer Security:

┌──────────────────────────────────┐
│   WAF (Web Application Firewall) │
│   - DDoS protection              │
│   - Rate limiting                │
│   - Bot detection                │
└──────────────────────────────────┘
              │
┌─────────────▼──────────────────────┐
│   API Gateway Security             │
│   - JWT validation                 │
│   - CORS enforcement               │
│   - Request signing (AWS SigV4)    │
└─────────────┬──────────────────────┘
              │
┌─────────────▼──────────────────────┐
│   Application-Level Security       │
│   - Input validation               │
│   - Authorization checks           │
│   - Audit logging                  │
│   - Encryption at rest             │
└──────────────────────────────────────┘

Data Protection:
- At rest: MongoDB encryption
- In transit: TLS 1.3
- Sensitive fields: Hashing (passwords), Encryption (PII)
- Key rotation: Every 90 days
- Secrets management: Vault/AWS Secrets Manager
```

### 11. **Development Workflow Optimization**

```
Local Development:
- Docker Compose for local MongoDB, Redis
- Mock external services (Stripe, etc.)
- Hot reload with NestJS

Staging Environment:
- Mimic production as closely as possible
- Full integration testing
- Performance testing
- Security scanning

Production Deployment:
- Blue-green deployment
- Canary releases (5% → 25% → 100%)
- Automated rollback on error
- Zero-downtime deployments
```

### 12. **Cost Optimization Strategy**

```
Database:
- MongoDB Atlas auto-scaling
- Archive old data (year-old messages → cold storage)
- Connection pooling

Compute:
- Horizontal auto-scaling
- Reserved instances for baseline
- Spot instances for batch jobs

Storage:
- S3 for images/files with CDN
- Lifecycle policies for old files
- Image optimization & compression

Monitoring:
- Cost allocation tags
- Monthly budget alerts
- Regular optimization reviews
```

---

## Additional Architectural Principles

### 1. **Repository Pattern**

Each module should have a repository layer for data access (in addition to Mongoose):

```
UserModule
├── schemas/user.schema.ts
├── repositories/user.repository.ts (abstract queries)
├── services/user.service.ts (business logic)
└── user.resolver.ts (GraphQL)
```

### 2. **DTOs for All I/O**

- Input DTOs: `*.input.ts` (for mutations)
- Output DTOs: `*.type.ts` (for queries)
- Filter DTOs: `*-filter.input.ts`

### 3. **Error Handling**

Create custom exception classes:

```
- BusinessLogicException
- ValidationException
- AuthenticationException
- AuthorizationException
- NotFoundException
```

### 4. **Logging Strategy**

- Structured logging (JSON format)
- Log levels: ERROR, WARN, INFO, DEBUG
- Track request ID through entire flow
- Log all database mutations

### 5. **GraphQL Schema Design**

- Use descriptive field names
- Implement pagination with cursors or offset+limit
- Use scalar types properly (DateTime, ObjectID)
- Implement proper error responses
- Version API from the start

---

**This architecture is production-ready and can scale to handle millions of users with proper implementation of the scalability considerations outlined above.**
