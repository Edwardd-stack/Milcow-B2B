/**
 * Enums are written as `as const` objects (not TypeScript `enum`)
 * so their values are plain string literals — compatible with the
 * enums Prisma generates from schema.prisma.
 */

export const MemberType = {
  BUYER: 'BUYER', // company that buys dairy products
  STAFF: 'STAFF', // warehouse staff — updates pickup status
  ADMIN: 'ADMIN', // back office
} as const;
export type MemberType = (typeof MemberType)[keyof typeof MemberType];

export const MemberStatus = {
  ACTIVE: 'ACTIVE',
  BLOCKED: 'BLOCKED',
  DELETED: 'DELETED',
} as const;
export type MemberStatus = (typeof MemberStatus)[keyof typeof MemberStatus];
