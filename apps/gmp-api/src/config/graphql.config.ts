import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

export const graphqlConfig: ApolloDriverConfig = {
  driver: ApolloDriver,
  autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
  debug: process.env.NODE_ENV !== 'production',
  playground: process.env.NODE_ENV !== 'production',
  formatError: (error) => {
    return {
      message: error.message,
      code: error.extensions?.code,
      statusCode: error.extensions?.statusCode,
    };
  },
};
