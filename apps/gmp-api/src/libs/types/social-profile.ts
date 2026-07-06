import { AuthProvider } from '../enums/user.enum';

// Normalized shape every OAuth provider profile is mapped into
export interface SocialProfile {
  provider: AuthProvider;
  providerId: string;
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}
