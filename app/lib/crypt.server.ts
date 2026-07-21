import { getEnv } from "./env.server";

const ENCRYPTION_KEY_NAME = "ENCRYPTION_KEY";
const ENVELOPE_ALGORITHM = "aes-256-gcm";
const WEB_CRYPTO_ALGORITHM = "AES-GCM";
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export type EncryptedValueEnvelope = {
  v: 1;
  alg: typeof ENVELOPE_ALGORITHM;
  iv: string;
  tag: string;
  ct: string;
};

let _rawKey: Uint8Array | null = null;

function getRawKey(): Uint8Array {
  if (_rawKey) return _rawKey;

  const key = getEnv(ENCRYPTION_KEY_NAME);
  if (!key) {
    throw new Error(`${ENCRYPTION_KEY_NAME} no está definida`);
  }

  const decoded = Uint8Array.from(atob(key), (c) => c.charCodeAt(0));
  if (decoded.length !== KEY_LENGTH) {
    throw new Error(
      `${ENCRYPTION_KEY_NAME} debe ser una clave de 32 bytes codificada en base64`,
    );
  }

  _rawKey = decoded;
  return _rawKey;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

async function getCryptoKey(): Promise<CryptoKey> {
  const rawKey = getRawKey();
  return crypto.subtle.importKey(
    "raw",
    rawKey.buffer.slice(
      rawKey.byteOffset,
      rawKey.byteOffset + rawKey.byteLength,
    ) as ArrayBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

function parseEnvelope(
  value: unknown,
): EncryptedValueEnvelope {
  if (typeof value !== "object" || value === null) {
    throw new Error("El valor cifrado no es válido");
  }

  const envelope = value as Record<string, unknown>;

  if (
    envelope.v !== 1 ||
    envelope.alg !== ENVELOPE_ALGORITHM ||
    typeof envelope.iv !== "string" ||
    typeof envelope.tag !== "string" ||
    typeof envelope.ct !== "string"
  ) {
    throw new Error("El valor cifrado no es válido");
  }

  return {
    v: envelope.v,
    alg: envelope.alg,
    iv: envelope.iv,
    tag: envelope.tag,
    ct: envelope.ct,
  };
}

export async function encryptValue(
  value: string,
): Promise<EncryptedValueEnvelope> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await getCryptoKey();
  const encoder = new TextEncoder();

  const encrypted = await crypto.subtle.encrypt(
    { name: WEB_CRYPTO_ALGORITHM, iv },
    key,
    encoder.encode(value),
  );

  const full = new Uint8Array(encrypted);
  const ct = full.slice(0, -AUTH_TAG_LENGTH);
  const tag = full.slice(-AUTH_TAG_LENGTH);

  return {
    v: 1,
    alg: ENVELOPE_ALGORITHM,
    iv: btoa(String.fromCharCode(...iv)),
    tag: btoa(String.fromCharCode(...tag)),
    ct: btoa(String.fromCharCode(...ct)),
  };
}

export async function decryptValue(
  encryptedValue: unknown,
): Promise<string> {
  try {
    const envelope = parseEnvelope(encryptedValue);

    const iv = Uint8Array.from(atob(envelope.iv), (c) => c.charCodeAt(0));
    const tag = Uint8Array.from(atob(envelope.tag), (c) => c.charCodeAt(0));
    const ct = Uint8Array.from(atob(envelope.ct), (c) => c.charCodeAt(0));

    if (iv.length !== IV_LENGTH || tag.length !== AUTH_TAG_LENGTH) {
      throw new Error("El valor cifrado no es válido");
    }

    const combined = new Uint8Array(ct.length + tag.length);
    combined.set(ct);
    combined.set(tag, ct.length);

    const key = await getCryptoKey();
    const decrypted = await crypto.subtle.decrypt(
      { name: WEB_CRYPTO_ALGORITHM, iv },
      key,
      combined,
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    throw new Error("El valor cifrado no es válido");
  }
}

export async function validateEncryptedValue(
  encryptedValue: unknown,
  plainValue: string,
) {
  try {
    const decrypted = await decryptValue(encryptedValue);
    const decArr = new TextEncoder().encode(decrypted);
    const plainArr = new TextEncoder().encode(plainValue);

    if (decArr.length !== plainArr.length) {
      return false;
    }

    return timingSafeEqual(decArr, plainArr);
  } catch {
    return false;
  }
}
