import type { Request } from 'express';
import type { MemberType } from '@milcow/shared';

/** What we put inside the JWT. Keep it small — the token travels with every request. */
export interface JwtPayload {
  sub: string; // member id ("subject" — standard JWT field)
  memberType: MemberType;
  warehouseId: string | null;
}

/** The logged-in member, attached to the request by AuthGuard. */
export interface AuthMember {
  id: string;
  memberType: MemberType;
  warehouseId: string | null;
}

export interface AuthRequest extends Request {
  member?: AuthMember;
}
