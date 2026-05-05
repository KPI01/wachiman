import { randomBytes, timingSafeEqual, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;
const HASH_SEPARATOR = ":";

export async function hashText(text: string) {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const derivedKey = (await scrypt(text, salt, KEY_LENGTH)) as Buffer;

  return `${salt}${HASH_SEPARATOR}${derivedKey.toString("hex")}`;
}

export async function validateHashedText(
  hashedText: string,
  plainText: string,
) {
  const [salt, storedHash] = hashedText.split(HASH_SEPARATOR);

  if (!salt || !storedHash) {
    return false;
  }

  const derivedKey = (await scrypt(plainText, salt, KEY_LENGTH)) as Buffer;
  const storedHashBuffer = Buffer.from(storedHash, "hex");

  if (storedHashBuffer.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(storedHashBuffer, derivedKey);
}
