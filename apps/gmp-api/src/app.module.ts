import { Module, Logger } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GraphQLModule } from '@nestjs/graphql';
import { JwtModule } from '@nestjs/jwt';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { GqlJwtAuthGuard } from './components/auth/guards/gql-jwt-auth.guard';
import { GqlRolesGuard } from './components/auth/guards/gql-roles.guard';

import databaseConfig from './libs/config/database.config';
import jwtConfig from './libs/config/jwt.config';
import { graphqlConfig } from './libs/config/graphql.config';

import { HealthModule } from './components/health/health.module';
import { UserModule } from './components/user/user.module';
import { AuthModule } from './components/auth/auth.module';
import { AgencyModule } from './components/agency/agency.module';
import { ServiceModule } from './components/service/service.module';
import { ApplicationModule } from './components/application/application.module';
import { ReviewModule } from './components/review/review.module';
import { CountryModule } from './components/country/country.module';
import { FollowModule } from './components/follow/follow.module';
import { MessagingModule } from './components/messaging/messaging.module';
import { SubscriptionModule } from './components/subscription/subscription.module';
import { AnalyticsModule } from './components/analytics/analytics.module';
import { AdminModule } from './components/admin/admin.module';
import { UploadModule } from './components/upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.local',
      load: [databaseConfig, jwtConfig],
    }),

    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('MongooseModule');
        let uri = configService.get<string>('database.mongodb.uri');

        if (uri) {
          try {
            const { MongoClient } = await import('mongodb');
            const client = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 });
            await client.connect();
            await client.db().command({ ping: 1 });
            await client.close();
            logger.log('Connected to configured MongoDB URI.');
          } catch (err) {
            logger.warn('Cannot connect to configured MongoDB URI, falling back to in-memory MongoDB.');
            const mongod = await MongoMemoryServer.create();
            uri = mongod.getUri();
          }
        } else {
          logger.log('MongoDB URI not set, starting in-memory MongoDB for local development.');
          const mongod = await MongoMemoryServer.create();
          uri = mongod.getUri();
        }

        return { uri, autoCreate: true };
      },
      inject: [ConfigService],
    }),

    GraphQLModule.forRoot(graphqlConfig),

    JwtModule.registerAsync({
      global: true,
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('jwt.secret'),
        signOptions: { expiresIn: configService.get('jwt.expiresIn') },
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    HealthModule,
    UserModule,
    AuthModule,
    AgencyModule,
    ServiceModule,
    ApplicationModule,
    ReviewModule,
    CountryModule,
    FollowModule,
    MessagingModule,
    SubscriptionModule,
    AnalyticsModule,
    AdminModule,
    UploadModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: GqlJwtAuthGuard,
    },
    GqlRolesGuard,
  ],
})
export class AppModule {}
