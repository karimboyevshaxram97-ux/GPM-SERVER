import * as path from 'path';

const appRoot = path.resolve(__dirname, '..', '..', '..');
const monorepoRoot = path.resolve(appRoot, '..', '..');

export const getEnvFilePaths = (): string[] => {
  const nodeEnv = process.env.NODE_ENV;
  const cwd = process.cwd();
  const workspaceAppRoot = path.join(cwd, 'apps', 'gmp-api');
  const envSpecific = nodeEnv
    ? [
        path.join(cwd, `.env.${nodeEnv}.local`),
        path.join(workspaceAppRoot, `.env.${nodeEnv}.local`),
        path.join(appRoot, `.env.${nodeEnv}.local`),
      ]
    : [];

  return [
    ...envSpecific,
    path.join(cwd, '.env.local'),
    path.join(cwd, '.env'),
    path.join(workspaceAppRoot, '.env.local'),
    path.join(workspaceAppRoot, '.env'),
    path.join(appRoot, '.env.local'),
    path.join(appRoot, '.env'),
    path.join(monorepoRoot, '.env.local'),
    path.join(monorepoRoot, '.env'),
  ];
};
