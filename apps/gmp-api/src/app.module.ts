import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GraphQLModule } from '@nestjs/graphql';
import { JwtModule } from '@nestjs/jwt';
import { MongoMemoryServer } from 'mongodb-memory-server';

import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import { graphqlConfig } from './config/graphql.config';

import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './common/health/health.module';

@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.local',
      load: [databaseConfig, jwtConfig],
    }),

    // MongoDB
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('MongooseModule');
        let uri = configService.get<string>('database.mongodb.uri');

        if (uri) {
          // Try connecting to the provided URI with a short timeout.
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
          logger.log('MONGODB_URI not set, starting in-memory MongoDB for local development.');
          const mongod = await MongoMemoryServer.create();
          uri = mongod.getUri();
        }

        return {
          uri,
          autoCreate: true,
        };
      },
      inject: [ConfigService],
    }),

    // GraphQL
    GraphQLModule.forRoot(graphqlConfig),

    // JWT
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('jwt.secret'),
        signOptions: {
          expiresIn: configService.get('jwt.expiresIn'),
        },
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    HealthModule,
    UserModule,
    AuthModule,
  ],
})
export class AppModule {}
