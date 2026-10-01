FROM node:24.18.0-alpine AS dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && corepack prepare pnpm@10.12.4 --activate \
  && pnpm install --frozen-lockfile

FROM dependencies AS build
COPY . .
RUN pnpm build

FROM node:24.18.0-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && corepack prepare pnpm@10.12.4 --activate \
  && pnpm install --prod --frozen-lockfile
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY --from=build /app/db ./db
COPY --from=build /app/scripts/healthcheck.mjs ./scripts/healthcheck.mjs
COPY --from=build /app/scripts/seed.ts ./scripts/seed.ts
COPY --from=build /app/app/lib/hash.server.ts ./app/lib/hash.server.ts
COPY --from=build /app/app/lib/username.ts ./app/lib/username.ts
COPY --from=build /app/scripts/migrate.mjs ./scripts/migrate.mjs
EXPOSE 3000
CMD ["pnpm", "start"]
