import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const SESSION_SECRET_NAME = "SESSION_SECRET";
const SECRET_LENGTH = 32;

type CliOptions = {
  envPath: string;
  secret: string;
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

    if (argument === "--secret") {
      const secret = argv[index + 1];

      if (!secret) {
        throw new Error("Falta el valor para --secret");
      }

      options.secret = secret;
      index += 1;
      continue;
    }

    throw new Error(`Argumento desconocido: ${argument}`);
  }

  return {
    envPath: options.envPath ?? path.resolve(process.cwd(), ".env"),
    secret: options.secret ?? generateSessionSecret(),
  };
}

function generateSessionSecret() {
  return randomBytes(SECRET_LENGTH).toString("base64");
}

function validateSessionSecret(secret: string) {
  if (secret.trim().length === 0) {
    throw new Error(`${SESSION_SECRET_NAME} no puede estar vacío`);
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
  const { envPath, secret } = parseArgs(process.argv.slice(2));
  validateSessionSecret(secret);

  const envContent = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  const nextEnvContent = upsertEnvValue(
    envContent,
    SESSION_SECRET_NAME,
    secret,
  );

  writeFileSync(envPath, nextEnvContent, "utf8");
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : "Error desconocido";
  console.error("Error al configurar el secreto de sesión:", message);
  process.exit(1);
}
