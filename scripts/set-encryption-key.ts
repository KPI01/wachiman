import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const ENCRYPTION_KEY_NAME = "ENCRIPTION_KEY";
const KEY_LENGTH = 32;

type CliOptions = {
  envPath: string;
  key: string;
};

function parseArgs(argv: string[]): CliOptions {
  const options: Partial<CliOptions> = {};

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--env") {
      const envPath = argv[index + 1];

      if (!envPath) {
        throw new Error("Missing value for --env");
      }

      options.envPath = path.resolve(process.cwd(), envPath);
      index += 1;
      continue;
    }

    if (argument === "--key") {
      const key = argv[index + 1];

      if (!key) {
        throw new Error("Missing value for --key");
      }

      options.key = key;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
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
      `${ENCRYPTION_KEY_NAME} must be a base64-encoded 32-byte key`,
    );
  }

  if (decodedKey.toString("base64") !== key) {
    throw new Error(
      `${ENCRYPTION_KEY_NAME} must be a valid base64-encoded value`,
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
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(message);
  process.exit(1);
}
