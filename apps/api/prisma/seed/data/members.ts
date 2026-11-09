import type { Lang, MemberType } from '@milcow/shared';

export interface MemberSeed {
  type: MemberType;
  email: string;
  nick: string;
  companyName?: string;
  bizNo?: string;
  phone?: string;
  lang: Lang;
  warehouseKey?: string; // STAFF only
}

// `.test` is a reserved domain — these addresses can never belong to a real person.
// All of them log in with SEED_PASSWORD (see ../index.ts).
export const MEMBERS: MemberSeed[] = [
  { type: 'ADMIN', email: 'admin@milcow.test', nick: 'Milcow Admin', lang: 'KO' },
  {
    type: 'BUYER',
    email: 'buyer@milcow.test',
    nick: '김민준',
    companyName: '(주)한빛유업',
    bizNo: '000-00-00001', // obviously fake 사업자등록번호
    phone: '010-0000-0001',
    lang: 'KO',
  },
  {
    type: 'BUYER',
    email: 'bakery@milcow.test',
    nick: 'Aziz Karimov',
    companyName: 'Seoul Morning Bakery',
    bizNo: '000-00-00002',
    phone: '010-0000-0002',
    lang: 'UZ',
  },
  { type: 'STAFF', email: 'staff.icheon@milcow.test', nick: '이천 센터 직원', lang: 'KO', warehouseKey: 'icheon' },
  {
    type: 'STAFF',
    email: 'staff.pyeongtaek@milcow.test',
    nick: '평택 센터 직원',
    lang: 'KO',
    warehouseKey: 'pyeongtaek',
  },
  { type: 'STAFF', email: 'staff.gimhae@milcow.test', nick: '김해 센터 직원', lang: 'KO', warehouseKey: 'gimhae' },
];
