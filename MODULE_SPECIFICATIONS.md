# GMP Module Specifications & Design Patterns

## Module-Level Architecture Guidelines

### Standard Module Structure

Every module should follow this pattern:

```
module/
├── schemas/
│   └── [entity].schema.ts
├── dto/
│   ├── create-[entity].input.ts
│   ├── update-[entity].input.ts
│   ├── [entity]-filter.input.ts
│   └── [entity].type.ts
├── repositories/
│   └── [entity].repository.ts
├── [module].service.ts
├── [module].resolver.ts
└── [module].module.ts
```

### Module Configuration Checklist

For each module, ensure:

- [ ] Schema properly indexed (see database indexing strategy below)
- [ ] DTO validation decorators on all inputs
- [ ] Repository abstraction layer created
- [ ] Service contains all business logic
- [ ] Resolver delegates to service
- [ ] Guards applied at resolver level
- [ ] Error handling with custom exceptions
- [ ] Logging on critical operations

---

## Database Indexing Strategy

### User Collection

```typescript
// Email lookup, authentication
db.users.createIndex({ email: 1 }, { unique: true });

// Username/slug for profiles
db.users.createIndex({ slug: 1 }, { unique: true });

// Status filtering, queries
db.users.createIndex({ status: 1, createdAt: -1 });

// Nationality for country-specific features
db.users.createIndex({ nationality: 1 });
```

### Agency Collection

```typescript
// Primary lookup
db.agencies.createIndex({ slug: 1 }, { unique: true });

// Verification status workflow
db.agencies.createIndex({
  verificationStatus: 1,
  createdAt: -1,
});

// Operating countries for geographic queries
db.agencies.createIndex({ operatingCountries: 1 });

// Subscription status for billing
db.agencies.createIndex({
  subscriptionStatus: 1,
  activeSubscription: 1,
});

// Admin discovery
db.agencies.createIndex({
  status: 1,
  createdAt: -1,
});

// Statistics aggregation
db.agencies.createIndex({ averageRating: -1, totalReviews: -1 });
```

### Service Collection (CRITICAL - Most Searched)

```typescript
// Full-text search
db.services.createIndex({
  name: "text",
  description: "text",
  keywords: "text",
});

// Service discovery by type and destination
db.services.createIndex({
  serviceType: 1,
  destinationCountry: 1,
  visibility: 1,
  status: 1,
});

// Agency services
db.services.createIndex({ agency: 1, status: 1 });

// Search + sorting
db.services.createIndex({
  destinationCountry: 1,
  averageRating: -1,
  totalReviews: -1,
});

// Filtering by multiple countries
db.services.createIndex({ sourceCountries: 1 });

// Time-based queries
db.services.createIndex({ createdAt: -1 });

// Tags for filtering
db.services.createIndex({ tags: 1 });

// Application capacity
db.services.createIndex({ status: 1, currentApplicationCount: 1 });
```

### Application Collection

```typescript
// User applications
db.applications.createIndex({ user: 1, createdAt: -1 });

// Agency incoming applications
db.applications.createIndex({
  agency: 1,
  status: 1,
  createdAt: -1,
});

// Service applications
db.applications.createIndex({ service: 1, status: 1 });

// Payment status tracking
db.applications.createIndex({ paymentStatus: 1, appliedAt: -1 });

// Review eligibility (completed applications)
db.applications.createIndex({
  user: 1,
  status: 1,
  completedAt: 1,
});

// Admin filtering
db.applications.createIndex({
  status: 1,
  priority: 1,
  createdAt: -1,
});
```

### Review Collection

```typescript
// Agency reviews
db.reviews.createIndex({
  agency: 1,
  status: 1,
  createdAt: -1,
});

// Service reviews
db.reviews.createIndex({
  service: 1,
  status: 1,
  createdAt: -1,
});

// User reviews
db.reviews.createIndex({ user: 1, createdAt: -1 });

// Moderation queue
db.reviews.createIndex({
  status: 1,
  createdAt: 1,
});

// Helpful reviews
db.reviews.createIndex({ helpful: -1, createdAt: -1 });

// Rating calculation
db.reviews.createIndex({
  agency: 1,
  status: 1,
  rating: 1,
});
```

### Message Collection

```typescript
// Conversation messages
db.messages.createIndex({ conversation: 1, createdAt: -1 });

// Sender messages
db.messages.createIndex({ sender: 1, createdAt: -1 });

// Unread messages
db.messages.createIndex({
  conversation: 1,
  isRead: 1,
  createdAt: -1,
});
```

### Conversation Collection

```typescript
// User conversations
db.conversations.createIndex({
  participants: 1,
  lastMessageAt: -1,
});

// Agency conversations
db.conversations.createIndex({
  agency: 1,
  lastMessageAt: -1,
});

// Unread count
db.conversations.createIndex({
  participants: 1,
  status: 1,
});
```

### Follow Collection

```typescript
// Unique constraint
db.follows.createIndex({ user: 1, agency: 1 }, { unique: true });

// User followers
db.follows.createIndex({ user: 1, followedAt: -1 });

// Agency followers
db.follows.createIndex({ agency: 1, followedAt: -1 });

// Notification queries
db.follows.createIndex({
  agency: 1,
  notificationsEnabled: 1,
});
```

### Subscription Collections

```typescript
// Active subscriptions
db.agencySubscriptions.createIndex({
  agency: 1,
  status: 1,
});

// Renewal dates (for cron jobs)
db.agencySubscriptions.createIndex({
  status: 1,
  renewalDate: 1,
});

// Payment history
db.agencySubscriptions.createIndex({
  agency: 1,
  createdAt: -1,
});
```

### Analytics Collections

```typescript
// Time-series queries
db.agencyStats.createIndex({
  agency: 1,
  date: -1,
});

db.serviceStats.createIndex({
  service: 1,
  date: -1,
});

// Date range queries
db.agencyStats.createIndex({ date: 1 });
db.serviceStats.createIndex({ date: 1 });
```

---

## GraphQL Query Complexity Management

### Query Complexity Scoring

```typescript
// Simple scalar field: 1 point
// Nested object: 2 + sum of children
// List with pagination: 5 × child complexity

Examples:
user {                          // 1
  id                            // 1
  name                          // 1
  reviews(first: 10) {          // 5 + 3×children
    _id                         // 1
    rating                      // 1
    title                       // 1
  }
}
// Total: 1 + 1 + 1 + 5 + (10 × 3) = 38

// Max complexity per query: 1000
// Max depth: 6 levels
// Max items per list: 100
```

---

## Pagination Strategy

### Cursor-Based Pagination (Preferred)

For large result sets, use cursor-based pagination:

```typescript
interface Edge<T> {
  node: T;
  cursor: string; // Base64 encoded
}

interface Connection<T> {
  edges: Edge<T>[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string;
    endCursor: string;
  };
  totalCount: number;
}
```

### Offset-Based Pagination (For Admin)

Simple offset + limit for admin queries:

```typescript
interface PaginationArgs {
  skip: number; // Default: 0
  take: number; // Default: 20, Max: 100
}

interface PagedResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
}
```

---

## Authentication & Authorization Strategy

### JWT Token Structure

```json
{
  "sub": "userId",
  "role": "USER|AGENCY_ADMIN|SUPER_ADMIN",
  "agencyId": "optional-if-agency-admin",
  "iat": 1234567890,
  "exp": 1234571490,
  "aud": "gmp-platform"
}
```

### Refresh Token Rotation

```typescript
// On each access token refresh:
1. Validate refresh token
2. Generate new access token
3. Generate new refresh token
4. Invalidate old refresh token
5. Return both tokens

// Rotation allows:
- Immediate revocation
- Limiting window of compromise
- Preventing token replay
```

### Role-Based Guards

```typescript
@Resolver()
export class UserResolver {
  // Public query
  @Public()
  @Query()
  getServices() {}

  // Authenticated user only
  @UseGuards(GqlJwtAuthGuard)
  @Query()
  myProfile() {}

  // Specific role
  @UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
  @Roles(UserRole.AGENCY_ADMIN)
  @Query()
  agencyDashboard() {}

  // Multiple roles
  @UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.AGENCY_ADMIN)
  @Query()
  approvalsQueue() {}
}
```

---

## Caching Strategy per Module

### Service Module (High Cache Priority)

```typescript
// Cache entire service objects
cache.set(`service:${id}`, service, 3600);  // 1 hour

// Cache service lists by filter
cache.set(
  `services:list:${hashFilter(filter)}`,
  results,
  1800  // 30 minutes
);

// Cache search results
cache.set(
  `services:search:${query}:${page}`,
  results,
  900   // 15 minutes
);

// Invalidation events:
- Service created/updated/deleted
- Service visibility changed
- Agency subscription status changed
```

### Review Module (Medium Cache Priority)

```typescript
// Cache review stats
cache.set(`reviews:agency:${agencyId}:stats`, stats, 3600);
cache.set(`reviews:service:${serviceId}:stats`, stats, 3600);

// Cache individual reviews
cache.set(`review:${id}`, review, 1800);

// Invalidation events:
- Review created/updated/deleted
- Review moderated
- Review status changed
```

### User Module (Low Cache Priority)

```typescript
// Cache user profile
cache.set(`user:${id}`, profile, 1800);

// Invalidation events:
- Profile updated
- Avatar changed
- Settings changed
```

---

## WebSocket Namespaces Design

### Connection Management

```typescript
// Namespace hierarchy
io.of("/messaging").on("connection", (socket) => {
  // User joins conversation
  socket.join(`conversation:${conversationId}`);

  // Emit new message to conversation
  io.of("/messaging")
    .to(`conversation:${conversationId}`)
    .emit("message:new", messageData);
});

io.of("/notifications").on("connection", (socket) => {
  // User joins personal notification room
  socket.join(`user:${userId}`);

  // Emit notification
  io.of("/notifications")
    .to(`user:${userId}`)
    .emit("notification:new", notificationData);
});

io.of("/realtime").on("connection", (socket) => {
  // Application status update
  socket.join(`application:${applicationId}`);

  // Emit status change
  io.of("/realtime")
    .to(`application:${applicationId}`)
    .emit("status:changed", statusData);
});
```

### Presence Tracking

```typescript
// User online status in conversation
socket.on("user:typing", (conversationId) => {
  io.of("/messaging")
    .to(`conversation:${conversationId}`)
    .emit("user:typing", { userId, isTyping: true });
});

socket.on("disconnect", () => {
  // Broadcast user offline
  io.of("/messaging").emit("user:offline", { userId });
});
```

---

## Email & Notification System Architecture

### Email Templates

```
templates/
├── auth/
│   ├── welcome.hbs
│   ├── email-verification.hbs
│   └── password-reset.hbs
├── application/
│   ├── submitted.hbs
│   ├── approved.hbs
│   ├── rejected.hbs
│   └── status-changed.hbs
├── review/
│   ├── new-review.hbs
│   └── review-reply.hbs
└── general/
    ├── new-follower.hbs
    └── unsubscribe.hbs
```

### Notification Queue

```typescript
// Priority-based queue
queue.add(
  "send-email",
  {
    to: "user@example.com",
    template: "application-approved",
    data: { applicationId },
  },
  {
    priority: 10, // High
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
);
```

---

## Error Response Format

### GraphQL Error Response

```json
{
  "data": null,
  "errors": [
    {
      "message": "Unauthorized",
      "extensions": {
        "code": "UNAUTHENTICATED",
        "timestamp": "2024-05-31T10:30:00Z",
        "path": ["userProfile"],
        "requestId": "req-12345"
      }
    }
  ]
}
```

### Business Logic Error Codes

```typescript
enum ErrorCode {
  // Auth
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  UNAUTHENTICATED = "UNAUTHENTICATED",
  UNAUTHORIZED = "UNAUTHORIZED",

  // Validation
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",

  // Business Logic
  AGENCY_NOT_VERIFIED = "AGENCY_NOT_VERIFIED",
  SUBSCRIPTION_EXPIRED = "SUBSCRIPTION_EXPIRED",
  SERVICE_CAPACITY_EXCEEDED = "SERVICE_CAPACITY_EXCEEDED",
  APPLICATION_ALREADY_EXISTS = "APPLICATION_ALREADY_EXISTS",
  CANNOT_REVIEW_WITHOUT_APPLICATION = "CANNOT_REVIEW_WITHOUT_APPLICATION",

  // Not Found
  NOT_FOUND = "NOT_FOUND",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  AGENCY_NOT_FOUND = "AGENCY_NOT_FOUND",
  SERVICE_NOT_FOUND = "SERVICE_NOT_FOUND",

  // Server
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
}
```

---

## Data Validation Strategy

### Input Validation Decorators

```typescript
// User registration input
export class RegisterInput {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @MinLength(8)
  @Matches(/[A-Z]/, { message: "password must contain uppercase" })
  @Matches(/[0-9]/, { message: "password must contain number" })
  password: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName: string;

  @IsOptional()
  @IsPhoneNumber("ZZ")
  phoneNumber?: string;
}

// Service filter input
export class ServiceFilterInput {
  @IsOptional()
  @IsEnum(ServiceType)
  serviceType?: ServiceType;

  @IsOptional()
  @IsMongoId()
  destinationCountry?: string;

  @IsOptional()
  @Min(0)
  @Max(5)
  minRating?: number;

  @IsOptional()
  @IsString()
  searchQuery?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  tags?: string[];
}
```

---

## File Upload Strategy

### Service Image Upload

```typescript
// Max 5 images per service
// Max 5MB per image
// Formats: JPEG, PNG

export class UploadServiceImages {
  @IsArray()
  @MaxLength(5)
  @ValidateNested({ each: true })
  files: Express.Multer.File[];
}

// Upload destination: S3
// Folder structure: services/{serviceId}/images/
// CDN: CloudFront
// Retention: Keep until service deleted + 30 days
```

---

This module specification document should be referenced during implementation phase.
