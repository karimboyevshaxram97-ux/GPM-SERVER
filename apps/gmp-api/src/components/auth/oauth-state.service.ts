import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

// Stateless, HMAC-signed OAuth `state` parameter (CSRF protection) — no session storage needed.
// Format: <nonce>.<expiresAt>.<signature>
const STATE_TTL_MS = 10 * 60 * 1000;

@Injectable()
export class OAuthStateService {
  constructor(private readonly configService: ConfigService) {}

  generate(): string {
    const nonce = randomBytes(16).toString('hex');
    const expiresAt = Date.now() + STATE_TTL_MS;
    const payload = `${nonce}.${expiresAt}`;
    return `${payload}.${this.sign(payload)}`;
  }

  validate(state: unknown): boolean {
    if (typeof state !== 'string') return false;
    const parts = state.split('.');
    if (parts.length !== 3) return false;

    const [nonce, expiresAt, signature] = parts;
    if (!/^\d+$/.test(expiresAt) || Date.now() > Number(expiresAt))
      return false;

    const expected = Buffer.from(this.sign(`${nonce}.${expiresAt}`));
    const provided = Buffer.from(signature);
    return (
      provided.length === expected.length && timingSafeEqual(provided, expected)
    );
  }

  private sign(payload: string): string {
    const secret = this.configService.get<string>('oauth.stateSecret') ?? '';
    return createHmac('sha256', secret).update(payload).digest('hex');
  }
}
