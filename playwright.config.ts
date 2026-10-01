import "dotenv/config";
import path from "node:path";
import { defineConfig } from "@playwright/test";

const port = 5183;
const dataDirectory = path.resolve(".e2e-data");
const uploadsPath = path.join(dataDirectory, "uploads");
const brandingPath = path.join(dataDirectory, "branding");
process.env.UPLOADS_BASE_PATH = uploadsPath;
process.env.BRANDING_BASE_PATH = brandingPath;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm dev",
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: String(port),
      UPLOADS_BASE_PATH: uploadsPath,
      BRANDING_BASE_PATH: brandingPath,
    },
  },
});
