import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

// scrypt: slow-by-design password hashing built into Node.js (no native package needed)
const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keyLength: number,
) => Promise<Buffer>;

const SALT_BYTES = 16;
const KEY_LENGTH = 64;

/** "Milcow1234!" → "scrypt$<salt>$<hash>" (a new random salt every time) */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const hash = await scrypt(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, saltBase64, hashBase64] = stored.split('$');
  if (algorithm !== 'scrypt' || !saltBase64 || !hashBase64) return false;

  const expected = Buffer.from(hashBase64, 'base64');
  const actual = await scrypt(password, Buffer.from(saltBase64, 'base64'), expected.length);
  // Constant-time comparison: does not leak how many characters matched
  return timingSafeEqual(actual, expected);
}
