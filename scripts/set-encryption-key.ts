import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const ENCRYPTION_KEY_NAME = "ENCRYPTION_KEY";
const KEY_LENGTH = 32;

type CliOptions = {
  envPath: string;
  key: string;
};

function parseArgs(argv: string[]): CliOptions {
  const options: Partial<CliOptions> = {};

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--") {
      continue;
    }

    if (argument === "--env" || argument.startsWith("--env=")) {
      const envPath = argument.startsWith("--env=")
        ? argument.slice("--env=".length)
        : argv[index + 1];

      if (!envPath) {
        throw new Error("Falta el valor para --env");
      }

      options.envPath = path.resolve(process.cwd(), envPath);
      if (argument === "--env") index += 1;
      continue;
    }

    if (argument === "--key") {
      const key = argv[index + 1];

      if (!key) {
        throw new Error("Falta el valor para --key");
      }

      options.key = key;
      index += 1;
      continue;
    }

    throw new Error(`Argumento desconocido: ${argument}`);
  }

  return {
    envPath: options.envPath ?? path.resolve(process.cwd(), ".env"),
    key: options.key ?? generateEncryptionKey(),
  };
}

function generateEncryptionKey() {
  return randomBytes(KEY_LENGTH).toString("base64");
}

function validateEncryptionKey(key: string) {
  const decodedKey = Buffer.from(key, "base64");

  if (decodedKey.length !== KEY_LENGTH) {
    throw new Error(
      `${ENCRYPTION_KEY_NAME} debe ser una clave de 32 bytes codificada en base64`,
    );
  }

  if (decodedKey.toString("base64") !== key) {
    throw new Error(
      `${ENCRYPTION_KEY_NAME} debe ser un valor válido codificado en base64`,
    );
  }
}

function upsertEnvValue(content: string, key: string, value: string) {
  const normalizedContent = content.replace(/\r\n/g, "\n");
  const line = `${key}=${value}`;
  const keyPattern = new RegExp(`^${key}=.*$`, "m");

  if (keyPattern.test(normalizedContent)) {
    return normalizedContent.replace(keyPattern, line);
  }

  if (normalizedContent.length === 0) {
    return `${line}\n`;
  }

  const separator = normalizedContent.endsWith("\n") ? "" : "\n";

  return `${normalizedContent}${separator}${line}\n`;
}

function main() {
  const { envPath, key } = parseArgs(process.argv.slice(2));
  validateEncryptionKey(key);

  const envContent = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  const nextEnvContent = upsertEnvValue(envContent, ENCRYPTION_KEY_NAME, key);

  writeFileSync(envPath, nextEnvContent, "utf8");
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : "Error desconocido";
  console.error("Error al configurar la clave de cifrado:", message);
  process.exit(1);
}
