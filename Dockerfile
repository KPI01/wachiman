FROM node:24.16.0-alpine AS development-dependencies
COPY . /app
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.12.4 --activate && pnpm install --frozen-lockfile

FROM node:24.16.0-alpine AS production-dependencies
COPY ./package.json pnpm-lock.yaml pnpm-workspace.yaml /app/
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.12.4 --activate && pnpm install --frozen-lockfile --prod

FROM node:24.16.0-alpine AS build
COPY . /app/
COPY --from=development-dependencies /app/node_modules /app/node_modules
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.12.4 --activate && pnpm orm:generate && pnpm run build

FROM node:24.16.0-alpine
COPY ./package.json pnpm-lock.yaml pnpm-workspace.yaml /app/
COPY --from=production-dependencies /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build
COPY --from=build /app/prisma/generated /app/prisma/generated
WORKDIR /app
ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000
RUN corepack enable && corepack prepare pnpm@10.12.4 --activate
CMD ["pnpm", "run", "start"]
