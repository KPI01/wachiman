import {
  createCipheriv,
  createDecipheriv,
  createSecretKey,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { performance } from "node:perf_hooks";

const ENCRYPTION_KEY_NAME = "ENCRIPTION_KEY";
const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export type EncryptedValueEnvelope = {
  v: 1;
  alg: typeof ALGORITHM;
  iv: string;
  tag: string;
  ct: string;
};

const encryptionKey = getEncryptionKey();

function getEncryptionKey() {
  const encryptionKeyValue = process.env[ENCRYPTION_KEY_NAME];

  if (!encryptionKeyValue) {
    throw new Error(`${ENCRYPTION_KEY_NAME} is not defined`);
  }

  const decodedKey = Buffer.from(encryptionKeyValue, "base64");

  if (decodedKey.length !== KEY_LENGTH) {
    throw new Error(
      `${ENCRYPTION_KEY_NAME} must be a base64-encoded 32-byte key`,
    );
  }

  return createSecretKey(decodedKey);
}

function parseEncryptedValueEnvelope(
  encryptedValue: unknown,
): EncryptedValueEnvelope {
  if (typeof encryptedValue !== "object" || encryptedValue === null) {
    throw new Error("Invalid encrypted value");
  }

  const envelope = encryptedValue as Record<string, unknown>;

  if (
    envelope.v !== 1 ||
    envelope.alg !== ALGORITHM ||
    typeof envelope.iv !== "string" ||
    typeof envelope.tag !== "string" ||
    typeof envelope.ct !== "string"
  ) {
    throw new Error("Invalid encrypted value");
  }

  return {
    v: envelope.v,
    alg: envelope.alg,
    iv: envelope.iv,
    tag: envelope.tag,
    ct: envelope.ct,
  };
}

export function encryptValue(value: string): EncryptedValueEnvelope {
  const start = performance.now();

  try {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, encryptionKey, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    const ciphertext = Buffer.concat([
      cipher.update(value, "utf8"),
      cipher.final(),
    ]);

    return {
      v: 1,
      alg: ALGORITHM,
      iv: iv.toString("base64"),
      tag: cipher.getAuthTag().toString("base64"),
      ct: ciphertext.toString("base64"),
    };
  } finally {
    console.log(
      `[encryptValue] ${(performance.now() - start).toFixed(2)}ms`,
    );
  }
}

export function decryptValue(encryptedValue: unknown): string {
  const start = performance.now();

  try {
    const envelope = parseEncryptedValueEnvelope(encryptedValue);
    const iv = Buffer.from(envelope.iv, "base64");
    const authTag = Buffer.from(envelope.tag, "base64");
    const ciphertext = Buffer.from(envelope.ct, "base64");

    if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error("Invalid encrypted value");
    }

    const decipher = createDecipheriv(ALGORITHM, encryptionKey, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);

    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new Error("Invalid encrypted value");
  } finally {
    console.log(
      `[decryptValue] ${(performance.now() - start).toFixed(2)}ms`,
    );
  }
}

export function validateEncryptedValue(
  encryptedValue: unknown,
  plainValue: string,
) {
  const start = performance.now();

  try {
    const decryptedValue = decryptValue(encryptedValue);
    const decryptedBuffer = Buffer.from(decryptedValue, "utf8");
    const plainValueBuffer = Buffer.from(plainValue, "utf8");

    if (decryptedBuffer.length !== plainValueBuffer.length) {
      return false;
    }

    return timingSafeEqual(decryptedBuffer, plainValueBuffer);
  } catch {
    return false;
  } finally {
    console.log(
      `[validateEncryptedValue] ${(performance.now() - start).toFixed(2)}ms`,
    );
  }
}
