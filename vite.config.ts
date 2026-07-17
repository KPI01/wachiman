import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [cloudflare(), tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "development",
    ),
    "process.env.APP_NAME": JSON.stringify(
      process.env.APP_NAME ?? "Wachiman App",
    ),
    "process.env.APP_LOGO": JSON.stringify(
      process.env.APP_LOGO ?? "/logoFruveco.svg",
    ),
    "process.env.APP_FAVICON": JSON.stringify(
      process.env.APP_FAVICON ?? "/copo-fruveco-azul.svg",
    ),
  },
});
