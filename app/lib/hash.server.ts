const SALT_LENGTH = 16;
const KEY_LENGTH = 64;
const HASH_SEPARATOR = ":";
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_HASH = "SHA-256";

function arrayToHex(arr: Uint8Array): string {
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToArray(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

async function pbkdf2(
  password: string,
  salt: Uint8Array,
  keyLength: number,
): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const encodedPassword = encoder.encode(password);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encodedPassword.buffer.slice(
      encodedPassword.byteOffset,
      encodedPassword.byteOffset + encodedPassword.byteLength,
    ) as ArrayBuffer,
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt.buffer.slice(
        salt.byteOffset,
        salt.byteOffset + salt.byteLength,
      ) as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    keyMaterial,
    keyLength * 8,
  );

  return new Uint8Array(derivedBits);
}

export async function hashText(text: string) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const derivedKey = await pbkdf2(text, salt, KEY_LENGTH);

  return `${arrayToHex(salt)}${HASH_SEPARATOR}${arrayToHex(derivedKey)}`;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

export async function validateHashedText(
  hashedText: string,
  plainText: string,
) {
  const [saltHex, storedHashHex] = hashedText.split(HASH_SEPARATOR);

  if (!saltHex || !storedHashHex) {
    return false;
  }

  const salt = hexToArray(saltHex);
  const storedHash = hexToArray(storedHashHex);

  const derivedKey = await pbkdf2(plainText, salt, KEY_LENGTH);

  return timingSafeEqual(storedHash, derivedKey);
}
