import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_HASH_PREFIX = "scrypt";

export function isPasswordHash(value: string) {
  return value.startsWith(`${PASSWORD_HASH_PREFIX}$`);
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString("hex");
  return `${PASSWORD_HASH_PREFIX}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedValue: string) {
  if (!isPasswordHash(storedValue)) {
    return password === storedValue;
  }

  const [, salt, storedHash] = storedValue.split("$");
  if (!salt || !storedHash) {
    return false;
  }

  const computedHash = scryptSync(password, salt, PASSWORD_KEY_LENGTH);
  const expectedHash = Buffer.from(storedHash, "hex");

  return (
    computedHash.length === expectedHash.length &&
    timingSafeEqual(computedHash, expectedHash)
  );
}
