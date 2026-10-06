import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { signHs256 } from '../common/auth/jwt.util';

type AdminClient = ReturnType<typeof createClient>;

interface PkceEntry {
  verifier: string;
  expiresAt: number;
}

@Injectable()
export class AuthService {
  // PKCE verifiers, keyed by the `state` we send with each authorize request.
  // Single-process in-memory store is fine for a hackathon.
  private readonly verifiers = new Map<string, PkceEntry>();

  constructor(private readonly configService: ConfigService) {}

  private supabaseUrl(): string {
    return this.configService.getOrThrow<string>('supabase.url');
  }

  /** Admin Supabase client. Mints a short-lived service-role JWT from the
   *  project's JWT secret when no real service-role key is configured. */
  private adminClient(): AdminClient {
    const url = this.supabaseUrl();
    const key = this.adminKey();
    return createClient(url, key);
  }

  private adminKey(): string {
    const configuredKey = this.configService.get<string>(
      'supabase.serviceRoleKey',
    );
    if (configuredKey?.startsWith('eyJ')) return configuredKey;

    const secret = this.configService.getOrThrow<string>('supabase.jwtSecret');
    const now = Math.floor(Date.now() / 1000);
    // Hackathon-only: the configured value is the raw JWT secret, so sign a
    // service_role token ourselves (Supabase's gateway accepts it).
    return signHs256(
      { role: 'service_role', iss: 'supabase', iat: now, exp: now + 300 },
      secret,
    );
  }

  /** Builds the Supabase/Google authorize URL using PKCE. The code verifier is
   *  held server-side so the backend (not the browser) completes the exchange. */
  getGoogleAuthUrl(): string {
    const verifier = randomBytes(32).toString('base64url');
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    const state = randomBytes(16).toString('hex');
    this.verifiers.set(state, {
      verifier,
      expiresAt: Date.now() + 10 * 60_000,
    });

    const backendUrl = this.configService.getOrThrow<string>('auth.backendUrl');
    const url = new URL(`${this.supabaseUrl()}/auth/v1/authorize`);
    url.searchParams.set('provider', 'google');
    url.searchParams.set(
      'redirect_to',
      `${backendUrl}/api/auth/google/callback`,
    );
    url.searchParams.set('code_challenge', challenge);
    url.searchParams.set('code_challenge_method', 'S256');
    url.searchParams.set('state', state);
    return url.toString();
  }

  /** Exchanges the PKCE code returned in the callback for a session. */
  async exchangeCode(code: string, state: string) {
    const entry = this.verifiers.get(state);
    if (!entry || entry.expiresAt < Date.now()) {
      throw new UnauthorizedException('Sign-in expired, please try again');
    }
    this.verifiers.delete(state);

    const body = new URLSearchParams({
      grant_type: 'pkce',
      auth_code: code,
      code_verifier: entry.verifier,
    });
    const response = await fetch(
      `${this.supabaseUrl()}/auth/v1/token?grant_type=pkce`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      },
    );
    if (!response.ok) {
      throw new UnauthorizedException('Could not complete Google sign-in');
    }
    const session = (await response.json()) as {
      access_token: string;
      refresh_token: string;
    };
    return session;
  }

  /** Fetches the full Supabase user profile for a session access token. */
  async getUser(accessToken: string) {
    const { data, error } = await this.adminClient().auth.getUser(accessToken);
    if (error || !data.user) {
      throw new UnauthorizedException('Invalid session token');
    }
    return data.user;
  }

  async refresh(refreshToken: string) {
    const { data, error } = await this.adminClient().auth.refreshSession({
      refresh_token: refreshToken,
    });
    if (error || !data.session) {
      throw new UnauthorizedException('Could not refresh session');
    }
    return data.session;
  }

  async logout(accessToken: string) {
    // User-scoped client so Supabase signs out the right session.
    const client = createClient(this.supabaseUrl(), accessToken);
    await client.auth.signOut();
  }
}
