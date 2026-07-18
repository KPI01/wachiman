import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  ssr: {
    external: ["better-sqlite3"],
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "development",
    ),
    "process.env.APP_NAME": JSON.stringify(
      process.env.APP_NAME ?? "Wachiman App",
    ),
    "process.env.APP_LOGO": JSON.stringify(
      process.env.APP_LOGO ?? "/app_logo.svg",
    ),
    "process.env.APP_FAVICON": JSON.stringify(
      process.env.APP_FAVICON ?? "/app_logo.svg",
    ),
  },
});
