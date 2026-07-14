import * as path from 'path';

const appRoot = path.resolve(__dirname, '..', '..', '..');
const monorepoRoot = path.resolve(appRoot, '..', '..');

export const getEnvFilePaths = (): string[] => {
  const nodeEnv = process.env.NODE_ENV;
  const envSpecific = nodeEnv
    ? [path.join(appRoot, `.env.${nodeEnv}.local`)]
    : [];

  return [
    ...envSpecific,
    path.join(appRoot, '.env.local'),
    path.join(appRoot, '.env'),
    path.join(monorepoRoot, '.env.local'),
    path.join(monorepoRoot, '.env'),
  ];
};
