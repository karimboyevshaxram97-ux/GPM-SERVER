import { Module, Logger } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GraphQLModule } from '@nestjs/graphql';
import { JwtModule } from '@nestjs/jwt';
import { GqlJwtAuthGuard } from './components/auth/guards/gql-jwt-auth.guard';
import { GqlRolesGuard } from './components/auth/guards/gql-roles.guard';

import databaseConfig from './libs/config/database.config';
import jwtConfig from './libs/config/jwt.config';
import oauthConfig from './libs/config/oauth.config';
import { getEnvFilePaths } from './libs/config/env-paths';
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
import { BootstrapModule } from './components/bootstrap/bootstrap.module';
import { UploadModule } from './components/upload/upload.module';
import { NotificationModule } from './components/notification/notification.module';
import { LikeModule } from './components/like/like.module';
import { ViewModule } from './components/view/view.module';
import { SupportModule } from './components/support/support.module';
import { PhotoModule } from './components/photo/photo.module';
import { ApplicationDocumentModule } from './components/application-document/application-document.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: getEnvFilePaths(),
      load: [databaseConfig, jwtConfig, oauthConfig],
    }),

    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('MongooseModule');
        let uri = configService.get<string>('database.mongodb.uri');

        const isProduction = process.env.NODE_ENV === 'production';
        const allowInMemory =
          !isProduction &&
          /^(1|true|yes)$/i.test(process.env.ALLOW_IN_MEMORY_MONGO ?? '');

        if (uri) {
          try {
            const { MongoClient } = await import('mongodb');
            const client = new MongoClient(uri, {
              serverSelectionTimeoutMS: 10000,
            });
            await client.connect();
            await client.db().command({ ping: 1 });
            await client.close();
            logger.log('Connected to configured MongoDB URI.');
          } catch (err) {
            if (!allowInMemory) {
              logger.error(
                'Cannot connect to configured MongoDB URI. Refusing to start without a persistent database.',
              );
              throw err;
            }
            logger.warn(
              'Cannot connect to configured MongoDB URI, using explicit in-memory MongoDB fallback.',
            );
            const { MongoMemoryServer } = await import('mongodb-memory-server');
            const mongod = await MongoMemoryServer.create();
            uri = mongod.getUri();
          }
        } else {
          if (!allowInMemory) {
            throw new Error(
              'MongoDB URI must be set. Set ALLOW_IN_MEMORY_MONGO=true only for disposable local demos/tests.',
            );
          }
          logger.warn(
            'MongoDB URI not set, using explicit in-memory MongoDB fallback.',
          );
          const { MongoMemoryServer } = await import('mongodb-memory-server');
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
    BootstrapModule,
    UploadModule,
    NotificationModule,
    LikeModule,
    ViewModule,
    SupportModule,
    PhotoModule,
    ApplicationDocumentModule,
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
