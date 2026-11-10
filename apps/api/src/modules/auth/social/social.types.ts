import type { SocialProvider } from '@milcow/shared';

/** What every provider returns after login — the rest of the app doesn't care which one it was */
export interface SocialProfile {
  provider: SocialProvider;
  providerId: string; // the user's id at Kakao / Google
  email: string | null;
  emailVerified: boolean;
  nick: string;
}

/** One adapter per provider (Kakao, Google). Adding Naver later = one more class like this. */
export interface SocialAuthProvider {
  readonly name: SocialProvider;
  /** Keys are in .env */
  isConfigured(): boolean;
  /** Step 1: where to send the browser */
  authorizeUrl(state: string, redirectUri: string): string;
  /** Step 2: exchange the one-time ?code= for a token, then read the profile */
  fetchProfile(code: string, redirectUri: string): Promise<SocialProfile>;
}

/** Saved in a short-lived signed cookie between "start" and "callback" (CSRF protection) */
export interface OAuthState {
  state: string;
  provider: SocialProvider;
  next: string;
}

/** Saved in a short-lived signed cookie until the company details are filled in */
export type PendingSocialSignup = Omit<SocialProfile, 'emailVerified'> & { next: string };
