# AGENTS.md

## Project Overview

`industrial-wachiman` is a role-based visitor access-control application with a Spanish-language UI.

Technology stack:

- React Router 7 in framework mode with SSR
- Vite
- React 19
- Prisma 7 with PostgreSQL
- Tailwind CSS 4
- pnpm 10

## Mandatory Rules

### User Communication

- Always respond to the user in Spanish, regardless of the language used in the request.
- Keep all new UI copy in Spanish to match the existing application.
- Never modify the contents inside `node_modules/` folder

### Package Management and Validation

- Use **pnpm 10** exclusively. Do not use npm or Yarn.
- Run `pnpm typecheck` after making changes. This is the project's required validation command.
- Do not rely on `pnpm lint`; it is currently broken because the project has no `eslint.config.js`.
- After editing `prisma/schema.prisma`, or when working from a fresh clone, run `pnpm orm:generate` before `pnpm typecheck` or `pnpm build`. The generated Prisma client is gitignored.
- Do not run React Router type generation separately. `pnpm typecheck` already runs `react-router typegen`.

### Architectural Boundaries

- Preserve the server-layer flow: routes → services → database entities → Prisma.
- Routes must call services and must never access Prisma directly.
- Services must use database entities and must never access Prisma directly.
- Only files in `app/lib/database/*.server.ts` may access `prisma.*` directly.
- Never import `*.server.ts` modules into client-side code.

## Development Commands

- `pnpm dev` — starts the development server using `HOST` and `PORT` from `.env`; the default port is 5173.
- `pnpm typecheck` — runs `react-router typegen && tsc`. Use this to validate changes.
- `pnpm build` — runs `react-router build` and outputs `build/client` and `build/server`.
- `pnpm start` — serves the production build on port 3000; run `pnpm build` first.
- `pnpm orm:generate` — runs `prisma generate` and regenerates `prisma/generated/prisma`.
- `pnpm db:migrate` / `pnpm db:seed` / `pnpm db:reset` — manage database migrations and seed data.
- `pnpm env:set-encryption-key` / `pnpm env:set-session-secret` — write secrets to `.env`.

## Application Architecture

### Routing and TypeScript

- Routing is declarative, not file-based. Add or edit routes in `app/routes.ts`.
- Route-module types are imported from `./+types/<name>` and generated in `.react-router/types`, which is gitignored.
- The `~/*` import alias maps to `app/*`.
- `tsconfig` enables `verbatimModuleSyntax: true`; use `import type` for type-only imports.

### Server Layers in `app/lib`

The required dependency flow is:

`routes` → `services/*.server.ts` → `database/*.server.ts` → Prisma

- `database/*.server.ts` contains Prisma entity classes with static methods, such as `UserEntity.getByUsername`. This is the only layer that accesses `prisma.*` directly. It also handles password hashing.
- `services/*.server.ts` contains Zod validation, using schemas from `schemas/*.ts`, and business logic. Services return shapes such as `{ success }` or `{ error }`.
- `schemas/*.ts` contains Zod schemas. Shared error messages live in `schemas/messages.ts`.
- The `*.server.ts` suffix identifies server-only modules. Never import them from client-side code.

## Authentication and Security

### Authentication and Sessions

- `auth.server.ts` provides:
  - `isAuthenticated(request)`, which redirects unauthenticated users to `/login`.
  - `validateUserRole(request, role | role[])`, which redirects unauthorized users to `/unauthorized`.
- Call `validateUserRole` in the `loader` of every protected route.
- Role groups map to route prefixes according to the `UserRole` enum: `/admin`, `/operator`, `/monitor`, `/security`, `/requester`, and `/approver`.
- The session cookie is named `wachiman-session` and has an eight-hour `maxAge`.
- `SESSION_SECRET` defaults to `dev-session-secret`; always configure it in production.
- `SESSION_COOKIE_SECURE` defaults to `true` when `NODE_ENV=production`. Set it to `false` when serving a production build over plain HTTP.
- Password hashing is implemented in `hash.server.ts` using scrypt and the `salt:hex` format.

### Encryption

- `crypt.server.ts` uses AES-256-GCM.
- Encrypted database values, such as `AccessLog.entrySignatureEnvelope`, are stored as an `EncryptedValueEnvelope` JSON object with the shape `{ v, alg, iv, tag, ct }`.
- The environment variable is intentionally misspelled as **`ENCRIPTION_KEY`**. Do not rename or replace it with `ENCRYPTION_KEY` unless the application is migrated accordingly.
- `ENCRIPTION_KEY` must be a base64-encoded 32-byte key.
- Generate it with `pnpm env:set-encryption-key`.

## Database and Prisma

- Prisma 7 uses the `prisma-client` generator with `output = ./generated/prisma`.
- Import the Prisma client and enums through their relative generated path from `app`, for example `../../prisma/generated/prisma/client`.
- Do not import the client or enums from `@prisma/client` in `node_modules`.
- The project uses `@prisma/adapter-pg` (`PrismaPg`) in both `app/lib/prisma.server.ts`, as a singleton, and `prisma/seed.ts`.
- The database connection string comes from `DATABASE_URL`.
- `prisma.config.ts` loads `dotenv/config` and reads `datasource.url` from the environment.

## Environment Configuration

`.env` is gitignored. Create it from `.env.example`.

Runtime variables:

- `DATABASE_URL` — PostgreSQL connection string, for example `postgres://postgres:postgres@127.0.0.1:55432/wachiman`.
- `ADMIN_PASSWORD` — the only variable strictly required by `pnpm db:seed`.
- `ENCRIPTION_KEY` — required by `crypt.server.ts`; note the intentional misspelling described above.
- `SESSION_SECRET` and `SESSION_COOKIE_SECURE` — session settings described in the authentication section.

Optional seed overrides:

- `ADMIN_FULL_NAME`
- `ADMIN_USERNAME`
- `SITE_NAME` / `SITE_SLUG`
- `DEPARTMENT_NAME` / `DEPARTMENT_SLUG`

## Docker

- `docker compose up` runs PostgreSQL 18.4 at `127.0.0.1:55432` and the application at `0.0.0.0:3000`.
- The application container waits for PostgreSQL, then runs `prisma migrate deploy && db:seed && start`.
- The application container forces `SESSION_COOKIE_SECURE=false`.
- Inside the container, the database host is `db:5432`, configured through `APP_DATABASE_URL`.

## UI Conventions

- shadcn/ui primitives live in `app/components/ui`; registry configuration is in `components.json`.
- Feature components live in `app/components/models`.
- Use `cn()` from `app/lib/utils.ts` for composing class names.
- Keep all UI strings in Spanish.
- Continue using the Spanish `date-fns` locale for date formatting.
