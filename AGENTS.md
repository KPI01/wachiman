# AGENTS.md

## Proyecto

`industrial-wachiman` es una aplicación de control de acceso industrial con interfaz en español.

- React Router 7 en modo framework, SSR y Vite.
- React 19, TypeScript, Tailwind CSS 4 y shadcn/ui.
- PostgreSQL ejecutado en Docker Compose.
- Drizzle ORM y Drizzle Kit; pnpm 10.

## Reglas obligatorias

### Comunicación y cambios

- Responde al usuario en español y conserva en español los textos nuevos de la interfaz.
- No modifiques contenidos dentro de `node_modules/`.
- Usa pnpm 10; no uses npm ni Yarn.
- Ejecuta `pnpm typecheck` después de cambiar código. No uses `pnpm lint`: el proyecto no tiene configuración ESLint.
- No ejecutes por separado la generación de tipos de rutas; `pnpm typecheck` ya ejecuta `react-router typegen`.

### Límites de arquitectura

Mantén el flujo `rutas → servicios → entidades de base de datos → Drizzle`.

- Las rutas llaman a servicios y no importan ni consultan Drizzle directamente.
- Los servicios contienen validaciones y lógica de negocio; usan entidades para acceder a datos.
- Solo `app/lib/database/*.server.ts` accede directamente a `db` y a las tablas Drizzle.
- No importes módulos `*.server.ts` desde código cliente.

## Comandos

- `pnpm dev`: servidor de desarrollo con `HOST` y `PORT` de `.env`.
- `pnpm build`: genera la aplicación de producción en `dist/`.
- `pnpm start`: sirve `dist/server/index.js` en el puerto 3000.
- `pnpm typecheck`: genera tipos de React Router y ejecuta TypeScript.
- `pnpm db:generate`: genera migraciones a partir de `db/schema.ts`.
- `pnpm db:migrate`: aplica migraciones PostgreSQL.
- `pnpm db:setup`: aplica migraciones y ejecuta el seed inicial.
- `pnpm db:seed`: crea datos iniciales faltantes sin reemplazar usuarios existentes.
- `pnpm db:reset --force`: elimina y recrea el esquema de la base configurada.
- `pnpm job:expire-documents`: marca documentos vencidos.
- `pnpm test`: ejecuta Vitest; `pnpm test:e2e` ejecuta Playwright.
- `pnpm env:set-encryption-key` y `pnpm env:set-session-secret`: generan secretos en `.env` (admiten `-- --env <ruta>`).

## Rutas y TypeScript

- Las rutas son declarativas. Se registran en `app/routes.ts`.
- Los tipos de módulos se importan desde `./+types/<ruta>` y los genera React Router en `.react-router/types/`.
- El alias `~/*` apunta a `app/*`.
- `verbatimModuleSyntax` está habilitado; usa `import type` para importar solo tipos.

## Capas de servidor

- `app/lib/database/*.server.ts`: entidades Drizzle con métodos estáticos; es la única capa con acceso directo a `db`.
- `app/lib/services/*.server.ts`: esquemas Zod, validación y reglas de negocio.
- `app/lib/schemas/*.ts`: esquemas compartidos y mensajes de validación.
- `*.server.ts` identifica módulos exclusivos del servidor.

## Autenticación y seguridad

- `auth.server.ts` expone `isAuthenticated(request)` y `validateUserRole(request, role | role[])`.
- Cada ruta protegida verifica el rol en su `loader` y también en su `action` cuando modifica datos.
- Roles y prefijos: `/admin`, `/operator`, `/monitor`, `/security`, `/requester` y `/approver`.
- La cookie de sesión se llama `wachiman-session` y dura ocho horas.
- Configura `SESSION_SECRET` en producción. `SESSION_COOKIE_SECURE` se activa por defecto en producción; puede desactivarse al servir HTTP detrás de una red controlada.
- Las contraseñas usan PBKDF2 y el formato hexadecimal `salt:hash` en `app/lib/hash.server.ts`.
- `app/lib/crypt.server.ts` cifra valores sensibles con AES-256-GCM y `ENCRYPTION_KEY`, una clave Base64 de 32 bytes.
- Las copias portables usan además una contraseña independiente. El manifiesto incluye una huella de la clave de cifrado; no exporta secretos de entorno.

## PostgreSQL y Drizzle

- `db/schema.ts` es el esquema de tablas y relaciones Drizzle.
- `db/client.ts` usa `pg` y `drizzle-orm/node-postgres`; `db/server.ts` inicializa la conexión de servidor.
- `DATABASE_URL` define la conexión PostgreSQL.
- `drizzle.config.ts` usa el dialecto `postgresql`; las migraciones vigentes están en `db/migrations-postgres/`.
- No se mantiene integración con Cloudflare, D1, Workers, Wrangler ni SQLite.

## Entorno y Docker Compose

`.env` y `.env.production` están excluidos de Git. Para desarrollo, copia `.env.local.example` a `.env` y `.env.production.example` a `.env.production` para iniciar el servicio PostgreSQL de Compose.

Variables principales:

- `DATABASE_URL`: host `127.0.0.1:55432` en desarrollo local y `db:5432` dentro de Compose.
- `POSTGRES_DB`, `POSTGRES_USER` y `POSTGRES_PASSWORD`: credenciales del servicio PostgreSQL.
- `ADMIN_PASSWORD`: contraseña inicial para el seed en una base nueva.
- `ENCRYPTION_KEY` y `SESSION_SECRET`: claves de aplicación.
- `UPLOADS_BASE_PATH`: archivos adjuntos, persistidos en el volumen de Compose.
- `BRANDING_BASE_PATH`: archivos de marca incluidos en las copias portables.

Compose ejecuta PostgreSQL 18.4 con volumen persistente, publica la base solo en loopback y espera a que esté saludable antes de migrar y arrancar la aplicación. No borres los volúmenes al detener servicios si necesitas conservar los datos.

## UI

- Los componentes shadcn/ui viven en `app/components/ui`; configuración en `components.json`.
- Componentes de dominio en `app/components/models`.
- Usa `cn()` desde `app/lib/utils.ts` para componer clases.
- Mantén las etiquetas y mensajes nuevos en español y conserva el locale español de `date-fns`.
