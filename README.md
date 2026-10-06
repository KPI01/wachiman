# Wachiman

Aplicación interna de control de acceso industrial para registrar y gestionar visitantes, trabajadores externos y accesos planificados. La interfaz está en español y organiza sus funciones por rol.

## Stack

- Node.js 24, React Router 7, React 19 y TypeScript.
- PostgreSQL 18 en contenedor y Drizzle ORM/Drizzle Kit.
- React, Tailwind CSS 4 y shadcn/ui.
- Sesiones mediante cookies; contraseñas con PBKDF2 y datos sensibles con AES-256-GCM.

## Desarrollo local

Requisitos: Node.js 24, pnpm 10 y Docker Compose.

```bash
cp .env.local.example .env
cp .env.production.example .env.production
pnpm install --frozen-lockfile
# Docker Compose:
docker compose up -d db
# Podman en Windows:
pnpm db:up
pnpm db:setup
pnpm dev
```

La base de datos queda disponible solo en `127.0.0.1:55432`. En Podman para Windows, `pnpm db:up` usa `docker-compose.dev.yml` para evitar un fallo del reenvío de puertos de la red bridge; reutiliza el volumen PostgreSQL existente. `pnpm db:down` detiene ese contenedor sin borrar los datos. Los ejemplos usan la misma contraseña local para PostgreSQL; cámbiala en ambos archivos si la modificas. `pnpm db:setup` aplica las migraciones y crea el usuario inicial. Cambia las contraseñas de ejemplo antes de usar datos reales.

Variables principales:

| Variable | Uso |
| --- | --- |
| `DATABASE_URL` | Conexión PostgreSQL; para la aplicación dentro de Compose, el host es `db`. |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Usuario inicial que crea el seed en una base nueva. |
| `ENCRYPTION_KEY` | Clave AES-256 de 32 bytes en Base64. Debe mantenerse al mover la instalación. |
| `SESSION_SECRET` | Secreto de firma de las sesiones. |
| `UPLOADS_BASE_PATH` | Carpeta de adjuntos, por defecto `./uploads`. |
| `BRANDING_BASE_PATH` | Carpeta de marca incluida en los respaldos, por defecto `./public/branding`. |

Genera los secretos en `.env` con:

```bash
pnpm env:set-encryption-key
pnpm env:set-session-secret
```

## Despliegue con Compose

1. Copia `.env.production.example` a `.env.production`.
2. Define una contraseña PostgreSQL segura y configura `ENCRYPTION_KEY`, `SESSION_SECRET` y `ADMIN_PASSWORD`.
3. Crea la carpeta `branding/` si almacenarás allí los recursos de marca.
4. Arranca los servicios:

```bash
docker compose up -d --build
docker compose ps
```

Compose espera a que PostgreSQL esté saludable, aplica migraciones y crea el usuario inicial sin reemplazar las contraseñas o datos existentes. PostgreSQL tiene un volumen persistente y solo se publica en loopback; la aplicación atiende en el puerto 3000.

Para detener la aplicación sin borrar datos: `docker compose down`. No añadas `--volumes` salvo que quieras eliminar la base de datos y los adjuntos persistentes.

## Copias portables

En **Administrador → Sistema → Copias de seguridad** se puede exportar o importar un respaldo manual. Se exige la contraseña actual de la cuenta y una contraseña independiente de al menos 12 caracteres para el archivo.

El archivo contiene todas las tablas, auditoría, adjuntos de `UPLOADS_BASE_PATH` y contenido de `BRANDING_BASE_PATH`. Se comprime y cifra con AES-256-GCM; el manifiesto versionado valida los checksums y contiene una huella de `ENCRYPTION_KEY`, pero no guarda variables de entorno ni secretos. La contraseña del archivo no se almacena.

Antes de importar, el panel descifra y verifica el archivo y muestra cuántos registros y archivos contiene. La importación actualiza los registros con el mismo ID y conserva los registros y archivos exclusivos del servidor. Si una clave única distinta del ID entra en conflicto, la transacción se revierte completa. También se verifica que coincida `ENCRYPTION_KEY`; conserva esa clave al migrar el despliegue.

Guarda una copia descargada fuera del servidor. No subas respaldos, claves ni archivos `.env` al repositorio.

## Base de datos y scripts

- `pnpm db:generate` genera una migración Drizzle desde `db/schema.ts`.
- `pnpm db:migrate` aplica migraciones.
- `pnpm db:seed` crea los datos iniciales que falten.
- `pnpm db:reset --force` destruye y recrea el esquema de la base configurada.
- `pnpm job:expire-documents` marca los documentos validados que hayan vencido.
- `pnpm typecheck` genera los tipos de rutas y ejecuta TypeScript.
- `pnpm test` ejecuta Vitest; `pnpm test:e2e` ejecuta Playwright.

Las migraciones iniciales PostgreSQL están en `db/migrations-postgres/`. La base nueva no importa datos heredados de SQLite o D1.

## Pruebas

Las pruebas unitarias cubren el formato cifrado, integridad del manifiesto, contraseña, huella de clave y validación de rutas. La suite de integración PostgreSQL usa una base temporal configurada mediante `DATABASE_URL_TEST`. Las pruebas Playwright se ejecutan contra la aplicación levantada y usan el usuario configurado por `ADMIN_USERNAME` y `ADMIN_PASSWORD`.

Antes de desplegar, ejecuta:

```bash
pnpm typecheck
pnpm test
pnpm test:e2e
```
