# Wachiman

Wachiman es un sistema de control de acceso industrial para registrar, monitorear y gestionar las entradas y salidas de personal, visitantes y trabajadores externos en instalaciones de planta. Incluye captura de firmas digitales, un flujo de aprobación de accesos planificados y paneles segmentados por rol de usuario.

## Demo en vivo

| Recurso          | Enlace                                                                                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Aplicación**   | [wachiman.jorgelurd11-557.workers.dev](https://wachiman.jorgelurd11-557.workers.dev)                                                                     |
| **Video**        | [Demostración en Google Drive](https://drive.google.com/file/d/1tZQwrjYUAJrD0YkDeFPJp387u6Y0Zall/view?usp=sharing)                                       |
| **Presentación** | [Google Slides](https://docs.google.com/presentation/d/1WKexqDzOq1EyvmUZdhAC3LrWTSUXuFsu/edit?usp=sharing&ouid=100727549007529328567&rtpof=true&sd=true) |

## Stack tecnológico

| Capa              | Tecnología                                        |
| ----------------- | ------------------------------------------------- |
| **Runtime**       | Node.js 24 / Cloudflare Workers                   |
| **Framework**     | React Router v7 (SSR + rutas API)                 |
| **Frontend**      | React 19, Tailwind CSS 4, shadcn/ui               |
| **Lenguaje**      | TypeScript                                        |
| **Base de datos** | SQLite (local) / Cloudflare D1 (producción)       |
| **ORM**           | Drizzle ORM (better-sqlite3 / D1)                 |
| **Autenticación** | Sesiones mediante cookies con PBKDF2 (Web Crypto) |
| **Cifrado**       | AES-256-GCM (Web Crypto)                          |
| **Despliegue**    | Cloudflare Workers + Wrangler                     |

## Instalación y ejecución

### Requisitos previos

- Node.js 24
- pnpm 10.12 o posterior

### 1. Configurar las variables de entorno

Copia el archivo de ejemplo para el entorno local:

```bash
cp .env.local.example .env.local
```

Variables obligatorias:

| Variable         | Descripción                                |
| ---------------- | ------------------------------------------ |
| `ENCRYPTION_KEY` | Clave AES-256-GCM en Base64 (32 bytes)     |
| `SESSION_SECRET` | Secreto para firmar las cookies de sesión  |
| `DATABASE_URL`   | URL de SQLite, por ejemplo `file:./dev.db` |

Variables opcionales utilizadas por el _seed_:

| Variable          | Valor predeterminado |
| ----------------- | -------------------- |
| `ADMIN_FULL_NAME` | `Administrador`      |
| `ADMIN_USERNAME`  | `admin`              |
| `ADMIN_PASSWORD`  | `demo123`            |
| `SITE_NAME`       | `Sitio principal`    |
| `SITE_SLUG`       | `PRINCIPAL`          |
| `DEPARTMENT_NAME` | `General`            |
| `DEPARTMENT_SLUG` | `GENERAL`            |

> [!WARNING]
> La contraseña `demo123` es solo para entornos de prueba. Cámbiala antes de desplegar la aplicación en producción.

Para generar o actualizar secretos en un archivo concreto, usa la opción `--env`:

```bash
pnpm env:set-encryption-key -- --env .env.production
pnpm env:set-session-secret -- --env .env.production
pnpm env:set-remote -- --env .env.production
```

También se admite la forma `--env=.env.production`. Si no se especifica un archivo, los comandos utilizan `.env`.

### 2. Instalar las dependencias

```bash
pnpm install
```

### 3. Configurar la base de datos

```bash
pnpm db:setup -- --env=.env.local

# Opcional: cargar datos realistas para la demo
pnpm db:seed -- --env=.env.local --mode=demo
```

`db:setup` prepara la base de datos SQLite: crea el archivo, aplica las migraciones y ejecuta el _seed_ básico. Los datos adicionales de demostración se cargan con `db:seed --mode=demo`.

### 4. Iniciar el entorno de desarrollo

```bash
pnpm build:local
pnpm start:local
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

### 5. Construir y ejecutar para producción con Node.js

```bash
pnpm build
pnpm start
```

## Despliegue en Cloudflare Workers

### Requisitos previos

- Una cuenta de Cloudflare
- Wrangler CLI autenticado mediante `pnpm exec wrangler login`

### 1. Configurar el entorno de Cloudflare

Crea `.dev.vars` para el desarrollo local con Wrangler:

```bash
cp .dev.vars.example .dev.vars
```

### 2. Crear la base de datos D1

```bash
pnpm exec wrangler d1 create wachiman
```

Copia el valor de `database_id` de la salida del comando en `wrangler.jsonc`.

### 3. Aplicar las migraciones de D1

```bash
# Generar migraciones
pnpm db:generate

# Aplicar migraciones a la base de datos D1 remota
pnpm db:migrate -- --target=d1

# Cargar los datos iniciales en D1
pnpm db:seed -- --target=d1

# Opcional: cargar datos realistas para la demo
pnpm db:seed -- --target=d1 --mode=demo
```

### 4. Configurar los secretos en Cloudflare

```bash
pnpm env:set-remote
```

`ENCRYPTION_KEY` y `SESSION_SECRET` se gestionan exclusivamente como secretos de Cloudflare y no deben declararse en `wrangler.jsonc`. Si un secreto queda expuesto, genera un valor nuevo y vuelve a ejecutar este comando.

### 5. Desplegar

```bash
pnpm deploy
```

### 6. Ejecutar una vista previa local con Wrangler

```bash
pnpm preview
```

## Despliegue en un servidor propio con Docker

El proyecto incluye `Dockerfile` y `docker-compose.yml` para un despliegue tradicional:

```bash
docker compose up -d
```

La misma configuración también se puede ejecutar con `podman compose`.

El _branding_ se monta externamente para poder modificarlo sin reconstruir la imagen:

```text
branding/
└── app_logo.svg
```

Configura `APP_LOGO` y `APP_FAVICON` en `.env.production` con rutas ubicadas bajo `/branding/`.

## Estructura del proyecto

```text
wachiman/
├── app/
│   ├── root.tsx                    # Layout raíz (HTML shell, ErrorBoundary)
│   ├── routes.ts                   # Configuración de rutas
│   ├── app.css                     # Estilos globales y Tailwind CSS
│   ├── routes/
│   │   ├── welcome.tsx             # Página de inicio pública
│   │   ├── login.tsx               # Formulario de inicio de sesión
│   │   ├── unauthorized.tsx        # Página de acceso no autorizado
│   │   ├── access-log.$id.tsx      # Vista de un registro de acceso
│   │   ├── auth/
│   │   │   ├── logout.tsx          # Cierre de sesión
│   │   │   └── reset-password.tsx  # Restablecimiento de contraseña (admin)
│   │   ├── admin/                  # Panel ADMIN (gestión completa)
│   │   │   ├── layout.tsx
│   │   │   ├── home.tsx
│   │   │   ├── users.tsx
│   │   │   ├── sites.tsx
│   │   │   ├── departments.tsx
│   │   │   ├── companies.tsx
│   │   │   ├── work-categories.tsx
│   │   │   ├── external-workers.tsx
│   │   │   ├── external-worker.$id.tsx
│   │   │   ├── access-logs.tsx
│   │   │   ├── planned-access.tsx
│   │   │   ├── audit-log.tsx
│   │   │   └── documents.tsx
│   │   ├── operator/               # Panel ACCESS_OPERATOR (portería)
│   │   ├── monitor/                # Panel ACCESS_MONITOR (solo lectura)
│   │   ├── security/               # Panel SECURITY_MANAGER
│   │   ├── approver/               # Panel ACCESS_APPROVER
│   │   ├── requester/              # Panel ACCESS_REQUESTER
│   │   └── api/
│   │       ├── dashboard/          # API de widgets del panel
│   │       ├── external-workers/   # API de trabajadores externos
│   │       └── worker-documents/   # Verificación de vencimiento de documentos
│   ├── components/
│   │   ├── ui/                     # Componentes shadcn/ui
│   │   ├── models/                 # Modales de formularios CRUD
│   │   ├── containers/             # Contenedores de layout
│   │   ├── dashboard/              # Widgets del panel
│   │   ├── app-sidebar.tsx         # Barra lateral de navegación
│   │   ├── app-menubar.tsx         # Menú superior
│   │   └── logo-branding.tsx       # Logotipo y branding
│   ├── hooks/                      # Hooks reutilizables
│   ├── lib/
│   │   ├── auth.server.ts          # Inicio y cierre de sesión; autenticación y roles
│   │   ├── session.server.ts       # Gestión de sesiones mediante cookies
│   │   ├── hash.server.ts          # Hash y validación de contraseñas (PBKDF2)
│   │   ├── crypt.server.ts         # Cifrado y descifrado AES-256-GCM
│   │   ├── platform.server.ts      # Detección del modo de almacenamiento documental
│   │   ├── env.server.ts           # Helper getEnv() para Workers y Node.js
│   │   ├── database/               # Acceso a datos (CRUD por entidad)
│   │   ├── services/               # Lógica de negocio
│   │   ├── schemas/                # Esquemas de validación Zod
│   │   └── columns/                # Definiciones de columnas para tablas
│   └── types/
│       └── env.d.ts
├── db/
│   ├── schema.ts                   # Esquema Drizzle (12 tablas, 4 enums, 18 relaciones)
│   ├── enums.ts                    # Enums como const y sus tipos
│   ├── client.ts                   # createLocalDb() y createD1Db()
│   ├── server.ts                   # Proxy singleton con initLocalDb() e initDb()
│   └── migrations/                 # Migraciones de Drizzle
├── worker/
│   └── index.ts                    # Punto de entrada para Cloudflare Workers
├── wrangler.jsonc                  # Configuración de Wrangler (D1, assets y variables)
├── .env.local.example              # Plantilla de variables locales
├── .env.production.example         # Plantilla de variables para despliegue propio
├── .dev.vars.example               # Plantilla de secretos para Wrangler local
└── scripts/                        # Scripts auxiliares
```

## Funcionalidades principales

### Roles de usuario y paneles

El sistema cuenta con seis roles, cada uno con un panel y permisos específicos:

| Rol                  | Funciones                                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ADMIN**            | Gestión completa de usuarios, sitios, departamentos, empresas, categorías de trabajo, trabajadores externos, registros de acceso, accesos planificados y bitácora de auditoría |
| **ACCESS_OPERATOR**  | Registro de entradas y salidas en portería, captura de firma digital y consulta de accesos del día y accesos planificados aprobados                                            |
| **ACCESS_MONITOR**   | Monitoreo en tiempo real en modo de solo lectura                                                                                                                               |
| **SECURITY_MANAGER** | Supervisión de registros de acceso, accesos planificados, trabajadores externos y bitácora                                                                                     |
| **ACCESS_APPROVER**  | Aprobación o rechazo de solicitudes de acceso planificado                                                                                                                      |
| **ACCESS_REQUESTER** | Creación y gestión de solicitudes de acceso planificado                                                                                                                        |

### Registro de accesos con firma digital

- Registro de entradas y salidas con datos personales, motivo de la visita, vehículo y empresa.
- Captura de firma digital al ingresar y salir mediante `canvas`.
- Firmas almacenadas en sobres cifrados con AES-256-GCM.
- Identificaciones personales (`legalId`) almacenadas de forma cifrada.

### Accesos planificados

- Flujo de aprobación: `PENDING_APPROVAL` → `APPROVED` / `REJECTED` → `USED` / `EXPIRED` / `CANCELED`.
- Registro individual por persona dentro de un acceso grupal.
- Estados disponibles: pendiente, aprobado, rechazado, cancelado, expirado, usado y parcialmente usado.

### Trabajadores externos

- Registro de trabajadores externos vinculados a empresas y categorías de trabajo.
- Gestión de documentos PDF, JPEG y PNG en el sistema de archivos.
- Control del vencimiento de documentos mediante verificación automática.

El almacenamiento documental se configura con `FILE_STORAGE_MODE=filesystem` y `UPLOADS_BASE_PATH`. Las rutas guardadas en la base de datos son relativas a ese directorio. En Cloudflare Workers se utiliza `FILE_STORAGE_MODE=disabled`.

La comprobación de documentos vencidos se ejecuta mediante `pnpm job:expire-documents`, programado por el servicio `cron` del servidor. El endpoint HTTP y el programador de Cloudflare no forman parte de este flujo operativo.

En un despliegue con Docker, el `cron` del servidor puede ejecutar el trabajo dentro del contenedor:

```cron
5 0 * * * cd /opt/wachiman && flock -n /tmp/wachiman-expiry.lock docker compose exec -T app pnpm job:expire-documents >> /var/log/wachiman-jobs.log 2>&1
```

El contenedor no es un requisito de SQLite; garantiza que el trabajo utilice el mismo `DATABASE_URL`, las mismas dependencias y el mismo volumen `/data` que la aplicación.

### Bitácora de auditoría

Registro automático de operaciones sensibles con información sobre la entidad, la acción, el usuario y sus metadatos.

### API del panel

Endpoints para actualizar los widgets en tiempo real:

- Cantidad de personas dentro de la instalación.
- Cantidad de accesos del día.
- Estado de los accesos planificados.
- Último acceso registrado.

## Usuarios de prueba

La contraseña predeterminada de todos los usuarios de prueba es `demo123`.

| Usuario       | Rol              |
| ------------- | ---------------- |
| `admin`       | ADMIN            |
| `porteria`    | ACCESS_OPERATOR  |
| `solicitante` | ACCESS_REQUESTER |
| `aprobador`   | ACCESS_APPROVER  |
| `visor`       | ACCESS_MONITOR   |
| `director`    | ADMIN            |

Para iniciar sesión:

1. Configura las variables de entorno en `.env.local`.
2. Ejecuta `pnpm db:setup -- --env=.env.local`.
3. Carga los usuarios de demostración con `pnpm db:seed -- --env=.env.local --mode=demo`.
4. Inicia la aplicación y accede a [http://localhost:3000/login](http://localhost:3000/login).
