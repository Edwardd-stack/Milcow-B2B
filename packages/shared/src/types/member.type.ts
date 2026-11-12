import type { Lang, MemberStatus, MemberType } from '../enums';

/** A member as the API returns it — never contains the password. */
export interface MemberInfo {
  id: string;
  memberType: MemberType;
  memberStatus: MemberStatus;
  memberEmail: string;
  memberNick: string;
  memberPhone: string | null;
  memberCompanyName: string | null;
  memberBizNo: string | null;
  memberLang: Lang;
  warehouseId: string | null;
  createdAt: string; // ISO date
}

/** POST /auth/login body */
export interface LoginInput {
  memberEmail: string;
  memberPassword: string;
}

/** POST /auth/signup body — a buyer (company) account */
export interface SignupInput extends LoginInput {
  memberNick: string;
  memberCompanyName: string;
  memberBizNo?: string; // 000-00-00000
  memberPhone?: string;
  memberLang?: Lang;
}

/** POST /auth/signup, POST /auth/login — the JWT itself travels in an httpOnly cookie, never in the body */
export interface AuthResponse {
  member: MemberInfo;
}

/** Social login providers */
export type SocialProvider = 'kakao' | 'google';

/** GET /auth/social/pending — a social login that still needs the company details */
export interface SocialPendingInfo {
  provider: SocialProvider;
  email: string | null; // null → ask for it (Kakao may not share the email)
  nick: string;
}

/** POST /auth/social/complete body */
export interface SocialCompleteInput {
  memberCompanyName: string;
  memberNick: string;
  memberEmail?: string; // required only when the provider gave no verified email
  memberBizNo?: string;
  memberPhone?: string;
  memberLang?: Lang;
}
