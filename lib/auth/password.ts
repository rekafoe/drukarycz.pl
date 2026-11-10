import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCb);
const KEYLEN = 64;
const MIN = 8;
const MAX = 128;

export function isPassword(value: string) {
  return value.length >= MIN && value.length <= MAX;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = (await scrypt(password, salt, KEYLEN)) as Buffer;
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

export async function passwordMatches(password: string, stored: string) {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  if (expected.length !== KEYLEN) return false;
  const key = (await scrypt(password, Buffer.from(saltHex, "hex"), KEYLEN)) as Buffer;
  return timingSafeEqual(key, expected);
}
