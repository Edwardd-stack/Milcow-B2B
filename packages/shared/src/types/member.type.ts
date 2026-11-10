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

/** POST /auth/signup, POST /auth/login — the JWT itself travels in an httpOnly cookie, never in the body */
export interface AuthResponse {
  member: MemberInfo;
}
