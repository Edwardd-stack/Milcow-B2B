import { ForbiddenException } from '@nestjs/common';
import { canDemoModify, maskContact } from '@milcow/shared';
import type { AuthMember } from '../../libs/types/auth.type';

/**
 * Demo sessions (demo admin / staff / buyer) may change only records owned by demo accounts.
 * Checked in the services, on top of @Roles — the UI hiding a button is never the protection.
 */
export function assertDemoCanModify(member: AuthMember, ownerIsDemo: boolean): void {
  if (!canDemoModify(member.isDemo, ownerIsDemo)) {
    throw new ForbiddenException('Demo accounts can only change demo data');
  }
}

/** Contact data for a demo session: real customers' e-mail and phone are masked */
export function contactFor<T extends { email: string; phone: string | null }>(
  member: AuthMember,
  contact: T,
  ownerIsDemo: boolean,
): T {
  return maskContact(contact, member.isDemo, ownerIsDemo);
}
