# GMP Backend Architecture - Quick Reference Guide

## 🎯 Architecture Overview

**GMP** is a B2B marketplace connecting international agencies with users seeking services (Study Abroad, Work Abroad, Travel, Visa Services).

### Key Principles

- **Service-first design**: Users search for services, not agencies
- **Subscription-based billing**: Agencies pay monthly fees
- **Real-time communication**: WebSocket for instant messaging
- **Role-based access**: USER, AGENCY_ADMIN, SUPER_ADMIN
- **Production-grade scalability**: Designed for millions of users

---

## 📊 Core Entities Relationship Map

```
USER ────────────────> SERVICE <───────────── AGENCY
  │                       │                        │
  ├─ applies ─────────> APPLICATION              │
  │                       │                        │
  ├─ writes ──────────────────> REVIEW           │
  │                                                │
  ├─ subscribes to ──────────────────────> FOLLOW
  │
  └─ messages ────────────> CONVERSATION
                                │
                            MESSAGE
```

### Primary Entities

| Entity                   | Purpose                                | Owner               |
| ------------------------ | -------------------------------------- | ------------------- |
| **User**                 | Platform users                         | USER role           |
| **Agency**               | Service providers                      | AGENCY_ADMIN role   |
| **Service**              | Core offering (Study/Work/Travel/Visa) | AGENCY              |
| **Application**          | User applies to service                | USER                |
| **Review**               | User rates agencies/services           | USER                |
| **Follow**               | User follows agency                    | USER                |
| **Message/Conversation** | Real-time chat                         | USER ↔ AGENCY       |
| **AgencySubscription**   | Monthly billing                        | SUPER_ADMIN manages |

---

## 📦 Module Dependencies

```
Auth ──────────┐
               ├──> User ──┐
User Profile ──┤           │
               │        ┌──┴──────────────────┐
               │        │                     │
Service ───────┤        ├──> Application     │
               │        │        │            │
Agency ────────┤        └────────┼─────────┘
               │                 │
Review ────────┴──> Rating      │
               Aggregation      │
Follow ───────────────────────┘
Messaging ──> WebSocket Gateway
Subscription ──> Billing
Analytics ──> Dashboard
Admin ──> Moderation
```

---

## 🔐 Authentication & Authorization

### JWT Token

```json
{
  "sub": "userId",
  "role": "USER|AGENCY_ADMIN|SUPER_ADMIN",
  "agencyId": "if-agency-admin",
  "iat": 1234567890,
  "exp": 1234571490
}
```

### Guard Application Pattern

```typescript
// Public endpoint
@Public()
@Query()
getServices() {}

// Authenticated user
@UseGuards(GqlJwtAuthGuard)
@Query()
myProfile() {}

// Role-specific
@UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
@Roles(UserRole.AGENCY_ADMIN)
@Query()
agencyDashboard() {}
```

---

## 🗄️ Database Indexes Priority

### Critical Indexes (Phase 1)

```
Service:
  - { serviceType: 1, destinationCountry: 1, visibility: 1, status: 1 }
  - { name: "text", description: "text", keywords: "text" }

Agency:
  - { slug: 1 }
  - { verificationStatus: 1, createdAt: -1 }

User:
  - { email: 1 } [unique]
  - { status: 1, createdAt: -1 }

Application:
  - { user: 1, createdAt: -1 }
  - { agency: 1, status: 1, createdAt: -1 }
```

### Secondary Indexes (Phase 3+)

```
Review:
  - { agency: 1, status: 1, createdAt: -1 }
  - { service: 1, status: 1, createdAt: -1 }

Message:
  - { conversation: 1, createdAt: -1 }
  - { sender: 1, createdAt: -1 }

Follow:
  - { user: 1, agency: 1 } [unique]
```

---

## 🚀 Phase-by-Phase Roadmap

| Phase | Weeks | Focus        | Deliverables             |
| ----- | ----- | ------------ | ------------------------ |
| 1     | 1-4   | Foundation   | Auth, DB, GraphQL setup  |
| 2     | 5-8   | Profiles     | User & Agency management |
| 3     | 9-12  | Marketplace  | Service CRUD, search     |
| 4     | 13-16 | Applications | Application workflow     |
| 5     | 17-20 | Reviews      | Rating & moderation      |
| 6     | 21-24 | Messaging    | WebSocket, real-time     |
| 7     | 25-26 | Follow       | User follows agency      |
| 8     | 27-30 | Billing      | Subscriptions, payments  |
| 9     | 31-34 | Analytics    | Dashboard, metrics       |
| 10    | 35-38 | Admin Tools  | Moderation, control      |
| 11    | 39-42 | Testing      | Tests, optimization      |
| 12    | 43-44 | Production   | Deploy, monitor          |

---

## 📈 Caching Strategy

### Redis Cache Layers

```
Services (High Priority):
  service:{id}                    → 1 hour
  services:list:{filter_hash}     → 30 minutes
  services:search:{query_hash}    → 15 minutes

Reviews (Medium Priority):
  reviews:agency:{id}:stats       → 1 hour
  review:{id}                     → 30 minutes

Users (Low Priority):
  user:{id}:profile               → 30 minutes

Invalidation: Event-driven on mutations
```

---

## 🌐 GraphQL Query Complexity

### Scoring System

- Scalar field: **1 point**
- Nested object: **2 points** + children
- List with pagination: **5 points** × child complexity

### Limits

- Max query complexity: **1000 points**
- Max nesting depth: **6 levels**
- Max list items: **100 per query**

---

## 🔔 WebSocket Architecture

### Namespaces

```
/messaging
  └─ conversation:{id}          (real-time messages)

/notifications
  └─ user:{id}                  (alerts, events)

/realtime
  └─ application:{id}           (status updates)
```

### Events

```
message:new          (new message in conversation)
user:typing          (user is typing indicator)
status:changed       (application status update)
notification:new     (platform notification)
user:online/offline  (presence)
```

---

## 💰 Subscription Model

### Plan Tiers

```
BASIC
  - Up to 5 active services
  - Up to 2 team members
  - Basic support
  - $99/month

STANDARD
  - Up to 20 active services
  - Up to 5 team members
  - Priority support
  - $299/month

PREMIUM
  - Unlimited services
  - Unlimited team members
  - 24/7 dedicated support
  - Advanced analytics
  - $999/month
```

### Billing Status Flow

```
ACTIVE ──> EXPIRED ──> auto-renew ──> ACTIVE
             │
             └──> manual cancel ──> CANCELLED
                                        │
                                        └──> reactivate ──> ACTIVE
```

---

## 🛡️ Error Handling

### Standard GraphQL Error Response

```json
{
  "errors": [
    {
      "message": "Unauthorized",
      "extensions": {
        "code": "UNAUTHENTICATED",
        "statusCode": 401,
        "requestId": "req-123"
      }
    }
  ]
}
```

### Common Error Codes

```
UNAUTHENTICATED         → Not logged in
UNAUTHORIZED            → Role/permission denied
VALIDATION_ERROR        → Input validation failed
AGENCY_NOT_VERIFIED     → Agency pending approval
SUBSCRIPTION_EXPIRED    → Subscription not active
CAPACITY_EXCEEDED       → Service at max capacity
NOT_FOUND               → Resource doesn't exist
INTERNAL_SERVER_ERROR   → Unexpected error
```

---

## 📝 Pagination Strategy

### Cursor-Based (Preferred)

```graphql
query {
  services(first: 20, after: "cursor123") {
    edges {
      node { ... }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

### Offset-Based (Admin)

```graphql
query {
  applications(skip: 0, take: 20) {
    items { ... }
    total
    hasMore
  }
}
```

---

## 🔍 Search Implementation

### Current (Phase 3)

- MongoDB full-text search on `Service` collection
- Field index: `{ name: "text", description: "text", keywords: "text" }`

### Future (Post-Launch)

- Elasticsearch/OpenSearch integration
- Faceted search
- Advanced filtering
- Relevance scoring

---

## 📊 Monitoring Checklist

### Metrics to Track

```
API Performance:
  - Response time (p50, p95, p99)
  - Error rate by endpoint
  - Request count

Database:
  - Query execution time
  - Slow query log
  - Connection pool usage
  - Replica lag

Cache:
  - Hit ratio
  - Eviction rate
  - Memory usage

WebSocket:
  - Active connections
  - Message throughput
  - Disconnection rate

Business:
  - Active agencies
  - Active subscriptions
  - Applications/day
  - User growth
```

---

## 🔧 Development Workflow

### Local Setup

```bash
# 1. Clone repository
git clone ...

# 2. Install dependencies
npm install

# 3. Start local services
docker-compose up

# 4. Create .env from .env.example
cp .env.example .env.local

# 5. Seed database
npm run seed

# 6. Start dev server
npm run start:dev

# 7. Open GraphQL Playground
# http://localhost:3000/graphql
```

### Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov

# Watch mode
npm run test:watch
```

### Code Quality

```bash
# Linting
npm run lint

# Formatting
npm run format

# Type checking
npm run type-check
```

---

## 🚢 Deployment Checklist

### Pre-Production

- [ ] All tests passing (80%+ coverage)
- [ ] Code review completed
- [ ] Security audit passed
- [ ] Performance testing completed
- [ ] Database migrations tested
- [ ] Secrets configured
- [ ] Monitoring set up

### Production

- [ ] MongoDB Atlas cluster ready
- [ ] Redis cluster ready
- [ ] Load balancer configured
- [ ] SSL certificates installed
- [ ] CDN configured (for images)
- [ ] Email service connected
- [ ] Payment provider tested
- [ ] Backup strategy implemented
- [ ] Disaster recovery tested
- [ ] On-call support arranged

---

## 🎓 Key Development Principles

1. **Type Safety**: Use TypeScript strictly
2. **Immutability**: Avoid mutating objects
3. **Single Responsibility**: One class, one job
4. **DRY**: Don't repeat yourself
5. **SOLID Principles**: Follow in module design
6. **Error Handling**: Never silently fail
7. **Logging**: Log all important operations
8. **Security First**: Validate everything
9. **Performance**: Index database, cache frequently accessed data
10. **Scalability**: Design for growth from day 1

---

## 📚 Document References

- **ARCHITECTURE.md**: Detailed entity definitions, relationships, development phases
- **MODULE_SPECIFICATIONS.md**: Module-level patterns, indexing strategy, validation rules
- **DEVELOPMENT_SETUP.md**: Environment setup, Docker configuration, CI/CD pipeline
- **This file**: Quick reference for daily development

---

**Ready to build! 🚀**

Start with Phase 1: Foundation & Core Infrastructure.
