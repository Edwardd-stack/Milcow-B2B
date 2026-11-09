import type { MemberInfo } from '@milcow/shared';
import type { Member } from '../../generated/prisma/client';

/** Database row → API shape. The password hash never leaves the server. */
export function toMemberInfo(member: Member): MemberInfo {
  return {
    id: member.id,
    memberType: member.memberType,
    memberStatus: member.memberStatus,
    memberEmail: member.memberEmail,
    memberNick: member.memberNick,
    memberPhone: member.memberPhone,
    memberCompanyName: member.memberCompanyName,
    memberBizNo: member.memberBizNo,
    memberLang: member.memberLang,
    warehouseId: member.warehouseId,
    createdAt: member.createdAt.toISOString(),
  };
}
