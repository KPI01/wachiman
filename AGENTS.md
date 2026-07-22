# AGENTS.md

`industrial-wachiman` — app de control de acceso de visitantes basada en roles (UI en español).
React Router 7 (modo framework, SSR) + Vite + React 19 + Prisma 7 (PostgreSQL) + Tailwind 4.
Gestor de paquetes: **pnpm 10** (no uses npm/yarn).

## Comandos

- `pnpm dev` — servidor de desarrollo según `HOST` y `PORT` de `.env` (5173 por defecto)
- `pnpm typecheck` — `react-router typegen && tsc`. **Esta es la verificación.** Úsalo después de cambios.
- `pnpm build` — `react-router build` → `build/client` + `build/server`
- `pnpm start` — sirve el build de producción en el puerto 3000 (requiere `pnpm build` antes)
- `pnpm orm:generate` — `prisma generate` → regenera `prisma/generated/prisma`
- `pnpm db:migrate` / `pnpm db:seed` / `pnpm db:reset`
- `pnpm env:set-encryption-key` / `pnpm env:set-session-secret` — escriben secretos en `.env`

### Advertencias de comandos

- **`pnpm lint` está roto** — no hay `eslint.config.js`. No confíes en él; usa `pnpm typecheck` para validar.
- Tras editar `prisma/schema.prisma` o en un clon nuevo, ejecuta `pnpm orm:generate` antes de `typecheck`/`build` (el cliente generado está gitignored).
- `typecheck` ya ejecuta `react-router typegen`; no necesitas llamar typegen aparte.

## Arquitectura

- **El ruteo es declarativo, no basado en archivos.** Agrega/edita rutas en `app/routes.ts`. Los tipos de módulos de ruta vienen de `./+types/<nombre>`, generados en `.react-router/types` (gitignored).
- Alias de importación: `~/*` → `app/*`.
- `tsconfig` tiene `verbatimModuleSyntax: true` — usa `import type` para imports solo de tipo.

### Capas del servidor en `app/lib/` (no te saltes capas)

Rutas → `services/*.server.ts` → `database/*.server.ts` → Prisma.

- `database/*.server.ts` — clases "Entity" de Prisma con métodos estáticos (p. ej. `UserEntity.getByUsername`). El único lugar que toca `prisma.*` directamente; también hace el hasheo de contraseñas.
- `services/*.server.ts` — validación zod (vía `schemas/*.ts`) + lógica de negocio; retornan formas `{ success }` o `{ error }`. Las rutas llaman a estos, nunca a Prisma directo.
- `schemas/*.ts` — esquemas zod; `schemas/messages.ts` contiene los strings de error compartidos.
- El sufijo `*.server.ts` = módulo solo de servidor. Nunca importes estos desde código cliente.

### Auth / sesiones

- `auth.server.ts`: `isAuthenticated(request)` (lanza redirect → `/login`) y `validateUserRole(request, role | role[])` (lanza redirect → `/unauthorized`). Llama `validateUserRole` en el `loader` de cada ruta protegida; los grupos de roles mapean a prefijos de ruta (`/admin`, `/operator`, `/monitor`, `/security`, `/requester`, `/approver`) según el enum `UserRole`.
- Cookie de sesión `wachiman-session`, maxAge 8h. `SESSION_SECRET` por defecto es `dev-session-secret` (defínelo en prod). `SESSION_COOKIE_SECURE` por defecto es true cuando `NODE_ENV=production` — ponlo en `false` si sirves el build de prod sobre HTTP plano.
- Hasheo de contraseñas: `hash.server.ts` (scrypt, formato `salt:hex`).

### Cifrado (nota el error ortográfico)

- `crypt.server.ts` hace AES-256-GCM y guarda un `EncryptedValueEnvelope` JSON `{ v, alg, iv, tag, ct }` en columnas de la BD (p. ej. `AccessLog.entrySignatureEnvelope`).
- La variable de entorno es **`ENCRIPTION_KEY`** (mal escrito — no es `ENCRYPTION_KEY`). Debe ser una clave de 32 bytes codificada en base64. Genera con `pnpm env:set-encryption-key`.

## Prisma

- Prisma 7 usa el generador `prisma-client` con **`output = ./generated/prisma`**. Importa el cliente y enums vía ruta relativa desde `app/` (p. ej. `../../prisma/generated/prisma/client`), **no** `@prisma/client` desde node_modules.
- Usa `@prisma/adapter-pg` (`PrismaPg`) cableado en `app/lib/prisma.server.ts` (singleton) y `prisma/seed.ts`. La cadena de conexión viene de `DATABASE_URL`.
- `prisma.config.ts` carga `dotenv/config` y lee `datasource.url` desde el entorno.

## Entorno

`.env` está gitignored; copia `.env.example`. Requeridos en tiempo de ejecución:

- `DATABASE_URL` — Postgres, p. ej. `postgres://postgres:postgres@127.0.0.1:55432/wachiman`
- `ADMIN_PASSWORD` — la única var estrictamente requerida por `db:seed`
- `ENCRIPTION_KEY` — requerida por `crypt.server.ts` (ver error ortográfico arriba)
- `SESSION_SECRET`, `SESSION_COOKIE_SECURE` — ver sección auth
- Defaults del seed sobreescribibles vía env: `ADMIN_FULL_NAME`, `ADMIN_USERNAME`, `SITE_NAME`/`SITE_SLUG`, `DEPARTMENT_NAME`/`DEPARTMENT_SLUG`

## Docker

`docker compose up` corre `postgres:18.4` en `127.0.0.1:55432` y la app en `0.0.0.0:3000`. El contenedor de la app espera a Postgres, luego ejecuta `prisma migrate deploy && db:seed && start`, y fuerza `SESSION_COOKIE_SECURE=false`. Dentro del contenedor el host de la BD es `db:5432` (`APP_DATABASE_URL`).

## Convenciones de UI

- Los primitivos de shadcn/ui están en `app/components/ui` (config del registro en `components.json`); los componentes de feature en `app/components/models`. Usa `cn()` desde `app/lib/utils.ts`.
- Los strings de UI y el formateo de fechas (`date-fns` locale `es`) están en español — mantén la UI nueva en español para coincidir.
