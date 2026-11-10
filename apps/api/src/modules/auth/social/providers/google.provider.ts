import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SocialAuthProvider, SocialProfile } from '../social.types';
import { getWithToken, postForm } from './oauth-http';

interface GoogleToken {
  access_token: string;
}

interface GoogleUser {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
}

/** Google OAuth 2.0 / OpenID Connect — https://developers.google.com/identity/protocols/oauth2/web-server */
@Injectable()
export class GoogleProvider implements SocialAuthProvider {
  readonly name = 'google' as const;

  constructor(private readonly config: ConfigService) {}

  private get clientId() {
    return this.config.get<string>('GOOGLE_CLIENT_ID');
  }

  isConfigured() {
    return !!this.clientId && !!this.config.get<string>('GOOGLE_CLIENT_SECRET');
  }

  authorizeUrl(state: string, redirectUri: string) {
    const query = new URLSearchParams({
      client_id: this.clientId ?? '',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account', // always let the user pick the account
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${query.toString()}`;
  }

  async fetchProfile(code: string, redirectUri: string): Promise<SocialProfile> {
    const token = await postForm<GoogleToken>('https://oauth2.googleapis.com/token', {
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.config.get<string>('GOOGLE_CLIENT_SECRET'),
      redirect_uri: redirectUri,
      code,
    });
    const user = await getWithToken<GoogleUser>(
      'https://openidconnect.googleapis.com/v1/userinfo',
      token.access_token,
    );

    return {
      provider: 'google',
      providerId: user.sub,
      email: user.email ?? null,
      emailVerified: !!user.email_verified,
      nick: user.name ?? user.email?.split('@')[0] ?? 'Google user',
    };
  }
}
