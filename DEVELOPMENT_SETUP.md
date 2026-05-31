# GMP Backend - Development & Deployment Setup

## Pre-Implementation Checklist

Before starting Phase 1 implementation, ensure the following are in place:

### Environment Setup

- [ ] Node.js v18+ installed
- [ ] MongoDB Community or Atlas cluster created
- [ ] Redis instance running (local or cloud)
- [ ] TypeScript knowledge verified
- [ ] NestJS knowledge refreshed
- [ ] GraphQL/Apollo understanding confirmed
- [ ] Git repository initialized
- [ ] CI/CD pipeline defined

### Project Initialization

```bash
# Create new NestJS project
nest new gmp-server
cd gmp-server

# Install core dependencies
npm install @nestjs/graphql @apollo/server graphql
npm install @nestjs/mongoose mongoose
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install @nestjs/websockets @nestjs/platform-ws
npm install class-validator class-transformer
npm install dotenv joi
npm install bcrypt
npm install graphql-middleware graphql-shield

# Development dependencies
npm install --save-dev @types/node typescript
npm install --save-dev eslint prettier
npm install --save-dev jest @types/jest ts-jest
npm install --save-dev @nestjs/testing
```

### Configuration Files Setup

#### `.env.example`

```
# Application
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/gmp-dev
MONGODB_ADMIN_USER=admin
MONGODB_ADMIN_PASSWORD=password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=3600
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRATION=604800

# GraphQL
GRAPHQL_DEBUG=true
GRAPHQL_PLAYGROUND=true

# Third-party Services
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Email (SendGrid or similar)
SENDGRID_API_KEY=
EMAIL_FROM=noreply@gmp-platform.com

# AWS (for S3 file uploads)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
S3_BUCKET_NAME=gmp-platform-uploads

# Logging
LOG_LEVEL=debug
```

### Docker Compose for Development

`docker-compose.yml`:

```yaml
version: "3.8"

services:
  mongodb:
    image: mongo:7.0
    container_name: gmp-mongodb
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
      MONGO_INITDB_DATABASE: gmp-dev
    volumes:
      - mongodb_data:/data/db
      - ./init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js:ro
    networks:
      - gmp-network

  redis:
    image: redis:7-alpine
    container_name: gmp-redis
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - gmp-network

  mongo-express:
    image: mongo-express:latest
    container_name: gmp-mongo-express
    ports:
      - "8081:8081"
    environment:
      ME_CONFIG_MONGODB_ADMINUSERNAME: admin
      ME_CONFIG_MONGODB_ADMINPASSWORD: password
      ME_CONFIG_MONGODB_URL: mongodb://admin:password@mongodb:27017/
    depends_on:
      - mongodb
    networks:
      - gmp-network

volumes:
  mongodb_data:
  redis_data:

networks:
  gmp-network:
    driver: bridge
```

### Mongoose Setup Pattern

```typescript
// config/database.config.ts
import { MongooseModuleAsyncOptions } from "@nestjs/mongoose";
import { ConfigService } from "@nestjs/config";

export const mongooseConfig = (): MongooseModuleAsyncOptions => ({
  useFactory: async (configService: ConfigService) => ({
    uri: configService.get<string>("MONGODB_URI"),
    retryAttempts: 3,
    retryDelay: 3000,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }),
  inject: [ConfigService],
});
```

### GraphQL Configuration Pattern

```typescript
// config/graphql.config.ts
import { ApolloDriverConfig } from "@nestjs/apollo";
import { join } from "path";

export const graphqlConfig: ApolloDriverConfig = {
  driver: ApolloDriver,
  autoSchemaFile: join(process.cwd(), "src/schema.gql"),
  debug: process.env.NODE_ENV !== "production",
  playground: process.env.NODE_ENV !== "production",

  // Enable error details
  formatError: (error) => {
    return {
      message: error.message,
      code: error.extensions?.code,
      statusCode: error.extensions?.statusCode,
    };
  },

  // CORS configuration
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ],
    credentials: true,
  },
};
```

---

## NestJS Best Practices to Follow

### 1. Module Organization

- One responsibility per module
- Clear boundaries between modules
- Explicit imports/exports
- Lazy-load modules where applicable

### 2. Service Pattern

```typescript
@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly logger: Logger,
  ) {}

  async findById(id: string): Promise<User> {
    this.logger.debug(`Finding user with id: ${id}`);
    const user = await this.userModel.findById(id).exec();

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }
}
```

### 3. Resolver Pattern

```typescript
@Resolver(() => UserType)
export class UserResolver {
  constructor(
    private readonly userService: UserService,
    private readonly currentUser: CurrentUser, // injected via decorator
  ) {}

  @Query(() => UserType)
  @UseGuards(GqlJwtAuthGuard)
  async me(@CurrentUser() user: User): Promise<UserType> {
    return this.userService.findById(user._id);
  }

  @Mutation(() => UserType)
  async updateProfile(
    @CurrentUser() user: User,
    @Args("input") input: UpdateUserInput,
  ): Promise<UserType> {
    return this.userService.updateUser(user._id, input);
  }
}
```

### 4. Exception Handling

```typescript
// custom-exception.ts
export class BusinessLogicException extends BadRequestException {
  constructor(
    message: string,
    public code: string,
  ) {
    super({
      statusCode: 400,
      message,
      code,
    });
  }
}

// Usage in service
if (agency.subscriptionStatus !== SubscriptionStatus.ACTIVE) {
  throw new BusinessLogicException(
    "Agency subscription is not active",
    "SUBSCRIPTION_EXPIRED",
  );
}
```

---

## Type Safety Best Practices

### 1. Mongoose Schema with TypeScript

```typescript
// user.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class User {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
  })
  email: string;

  @Prop({ required: true, select: false }) // Exclude from queries by default
  password: string;

  @Prop({ enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ email: 1 });
UserSchema.index({ slug: 1 });
```

### 2. GraphQL Type Definitions

```typescript
// user.type.ts
import { ObjectType, Field, ID } from "@nestjs/graphql";

@ObjectType()
export class UserType {
  @Field(() => ID)
  _id: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  email: string;

  @Field(() => UserRole)
  role: UserRole;

  @Field(() => UserStatus)
  status: UserStatus;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
```

---

## Testing Strategy

### Unit Tests

```typescript
describe("UserService", () => {
  let service: UserService;
  let model: Model<UserDocument>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: {
            findById: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    model = module.get<Model<UserDocument>>(getModelToken(User.name));
  });

  describe("findById", () => {
    it("should return a user", async () => {
      const mockUser = { _id: "123", firstName: "John" };
      jest.spyOn(model, "findById").mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      } as any);

      const result = await service.findById("123");
      expect(result).toEqual(mockUser);
    });
  });
});
```

### E2E Tests

```typescript
describe("User (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe("POST /graphql (login)", () => {
    it("should authenticate user", () => {
      return request(app.getHttpServer())
        .post("/graphql")
        .send({
          query: `
            mutation {
              login(input: { email: "user@test.com", password: "password" }) {
                accessToken
                user { _id email }
              }
            }
          `,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.login.accessToken).toBeDefined();
        });
    });
  });
});
```

---

## Deployment Configuration

### Production Environment Variables

```
NODE_ENV=production
PORT=3000

# Database - MongoDB Atlas
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/gmp-prod

# Redis - Cloud Redis (e.g., AWS ElastiCache)
REDIS_HOST=redis-endpoint.123.ng.0001.apse1.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=secure-password

# JWT - Use strong secrets
JWT_SECRET=<64-character-random-string>
JWT_REFRESH_SECRET=<64-character-random-string>

# Stripe
STRIPE_SECRET_KEY=sk_live_...

# AWS S3
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1

# SendGrid
SENDGRID_API_KEY=SG....
```

### Docker Production Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
```

### Kubernetes Deployment (Optional)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gmp-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gmp-api
  template:
    metadata:
      labels:
        app: gmp-api
    spec:
      containers:
        - name: gmp-api
          image: gmp-api:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: production
            - name: MONGODB_URI
              valueFrom:
                secretKeyRef:
                  name: gmp-secrets
                  key: mongodb-uri
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
```

---

## Git Workflow & Branching Strategy

### Branch Naming Convention

```
main                    # Production-ready code
├── develop            # Integration branch
│   ├── feature/auth-module
│   ├── feature/user-module
│   ├── feature/service-module
│   ├── bugfix/jwt-validation
│   └── chore/update-dependencies
```

### Commit Message Convention

```
feat: add user authentication module
^--^  ^----------------------------------^
│     └─ description (lowercase)
└─ type: feat, fix, docs, style, refactor, perf, test, chore
```

### Pull Request Process

1. Create feature branch from `develop`
2. Make changes with atomic commits
3. Create PR with clear description
4. Code review (minimum 2 approvals)
5. Run all tests and linting
6. Merge to `develop`
7. Merge `develop` to `main` for releases

---

## CI/CD Pipeline (GitHub Actions)

### `.github/workflows/test.yml`

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mongodb:
        image: mongo:7.0
        options: >-
          --health-cmd "mongosh --eval 'db.adminCommand(\"ping\")'"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 27017:27017

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run test:e2e
      - run: npm run build
```

---

## Monitoring & Logging Setup

### Application Logging Configuration

```typescript
// logger.service.ts
import { Logger, Injectable } from "@nestjs/common";

@Injectable()
export class LoggerService {
  private logger = new Logger("GMP");

  log(message: string, context?: string) {
    this.logger.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "INFO",
        message,
        context,
      }),
    );
  }

  error(message: string, stack?: string, context?: string) {
    this.logger.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "ERROR",
        message,
        stack,
        context,
      }),
    );
  }
}
```

### Health Check Endpoint

```typescript
// health.controller.ts
@Controller("health")
export class HealthController {
  @Get()
  check() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
```

---

## Performance Optimization Checklist

- [ ] Database indexes created for all frequently queried fields
- [ ] GraphQL query complexity validation implemented
- [ ] Pagination implemented (cursor-based for large sets)
- [ ] Field-level resolvers optimized (no N+1 queries)
- [ ] DataLoader implemented for batch loading
- [ ] Redis caching for frequently accessed data
- [ ] Database query logging to identify slow queries
- [ ] API rate limiting implemented
- [ ] Compression middleware enabled
- [ ] Connection pooling configured

---

## Security Checklist

- [ ] HTTPS enforced in production
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL/NoSQL injection prevention
- [ ] XSS protection headers configured
- [ ] CSRF tokens for mutations
- [ ] Secrets management (no hardcoded secrets)
- [ ] Password hashing (bcrypt)
- [ ] JWT token rotation implemented
- [ ] Audit logging for sensitive operations
- [ ] Regular dependency security updates

---

**Ready to start Phase 1 implementation!**
