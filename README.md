# Wachiman

Sistema de control de acceso industrial para el registro, monitoreo y gestión de entradas y salidas de personal, visitantes y trabajadores externos en instalaciones de planta. Incluye captura de firmas digitales, flujo de aprobación de accesos planificados y dashboards segmentados por rol de usuario.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| **Runtime** | Node.js 24 / Cloudflare Workers |
| **Framework** | React Router v7 (SSR + rutas API) |
| **Frontend** | React 19, Tailwind CSS 4, shadcn/ui |
| **Lenguaje** | TypeScript |
## Demo en vivo

| Recurso | Enlace |
|---|---|
| **App** | [wachiman.jorgelurd11-557.workers.dev](https://wachiman.jorgelurd11-557.workers.dev) |
| **Video** | [Drive — Demostración](https://drive.google.com/file/d/1tZQwrjYUAJrD0YkDeFPJp387u6Y0Zall/view?usp=sharing) |
| **Slides** | [Google Slides](https://docs.google.com/presentation/d/1WKexqDzOq1EyvmUZdhAC3LrWTSUXuFsu/edit?usp=sharing&ouid=100727549007529328567&rtpof=true&sd=true) |

| **Base de datos** | SQLite (local) / Cloudflare D1 (producción) |
| **ORM** | Drizzle ORM (better-sqlite3 / D1) |
| **Autenticación** | Sesiones por cookie con PBKDF2 (Web Crypto) |
| **Cifrado** | AES-256-GCM (Web Crypto) |
| **Deploy** | Cloudflare Workers + Wrangler |

## Instalación y ejecución

### Requisitos previos

- Node.js 24
- pnpm 10.12+

### 1. Variables de entorno

Copia el archivo de ejemplo y configura las variables:

```bash
cp .env.example .env
```

El seed usa la contraseña por defecto `demo123` para todos los usuarios de prueba.

Variables obligatorias:

| Variable | Descripción |
|---|---|---|
| `ENCRYPTION_KEY` | Clave AES-256-GCM en base64 (32 bytes) |
| `SESSION_SECRET` | Secreto para firmar cookies de sesión |
| `DATABASE_URL` | URL SQLite (`file:./dev.db`) |

Variables opcionales con valores por defecto en el seed:

| Variable | Valor por defecto |
|---|---|
| `ADMIN_FULL_NAME` | `Administrador` |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | `demo123` |
| `SITE_NAME` | `Sitio principal` |
| `SITE_SLUG` | `PRINCIPAL` |
| `DEPARTMENT_NAME` | `General` |
| `DEPARTMENT_SLUG` | `GENERAL` |

Para generar o actualizar secretos en un archivo concreto, usa `--env`:

```bash
pnpm env:set-encryption-key -- --env .env.production
pnpm env:set-session-secret -- --env .env.production
pnpm env:set-remote -- --env .env.production
```

También se admite la forma `--env=.env.production`. Si no se especifica, se usa `.env`.

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Configurar la base de datos

```bash
pnpm db:create
pnpm db:migrate
pnpm db:seed              # Sitio, departamento y administrador
pnpm db:seed:demo         # Datos realistas adicionales, sin borrar datos
```

### 4. Iniciar en desarrollo

```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:5173`.

### 5. Construcción para producción (Node.js)

```bash
pnpm build
pnpm start
```

## Despliegue en Cloudflare Workers

### Requisitos previos

- Cuenta Cloudflare
- Wrangler CLI autenticado (`pnpm exec wrangler login`)

### 1. Configurar entorno Cloudflare

Crear `.dev.vars` para desarrollo local con Wrangler:

```bash
cp .dev.vars.example .dev.vars
```

### 2. Crear base de datos D1

```bash
npx wrangler d1 create wachiman
```

Copiar el `database_id` del output a `wrangler.jsonc`.

### 3. Aplicar migraciones D1

```bash
# Generar migraciones (desarrollo)
pnpm db:generate

# Aplicar migraciones a D1 remoto
pnpm db:migrate -- --target=d1

# Seed principal en D1 remoto
pnpm db:seed -- --target=d1

# Datos realistas adicionales en D1 remoto
pnpm db:seed:demo -- --target=d1
```

### 4. Configurar secrets en Cloudflare

```bash
pnpm env:set-remote
```

### 5. Deploy

```bash
pnpm deploy
```

### 6. Preview local con Wrangler

```bash
pnpm preview
```

## Deploy en servidor propio con Docker

El proyecto incluye `Dockerfile` y `docker-compose.yml` para despliegue tradicional:

```bash
docker compose up -d
```

El branding se monta externamente para poder cambiarlo sin reconstruir la imagen:

```text
branding/
└── app_logo.svg
```

Configura `APP_LOGO` y `APP_FAVICON` con rutas bajo `/branding/` en `.env.production`.

## Estructura del proyecto

```
wachiman/
├── app/
│   ├── root.tsx                    # Layout raíz (HTML shell, ErrorBoundary)
│   ├── routes.ts                   # Configuración de rutas
│   ├── app.css                     # Estilos globales + Tailwind
│   ├── routes/
│   │   ├── welcome.tsx             # Landing page pública
│   │   ├── login.tsx               # Formulario de inicio de sesión
│   │   ├── unauthorized.tsx        # Página de acceso no autorizado
│   │   ├── access-log.$id.tsx      # Vista de un registro de acceso
│   │   ├── auth/
│   │   │   ├── logout.tsx          # Cierre de sesión
│   │   │   └── reset-password.tsx  # Restablecer contraseña (admin)
│   │   ├── admin/                  # Dashboard ADMIN (gestión completa)
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
│   │   ├── operator/               # Dashboard ACCESS_OPERATOR (portería)
│   │   ├── monitor/                # Dashboard ACCESS_MONITOR (solo lectura)
│   │   ├── security/               # Dashboard SECURITY_MANAGER
│   │   ├── approver/               # Dashboard ACCESS_APPROVER
│   │   ├── requester/              # Dashboard ACCESS_REQUESTER
│   │   └── api/
│   │       ├── dashboard/          # APIs de widgets de dashboard
│   │       ├── external-workers/   # APIs de trabajadores externos
│   │       └── worker-documents/   # Verificación de expiración de documentos
│   ├── components/
│   │   ├── ui/                     # Componentes shadcn/ui
│   │   ├── models/                 # Modales de formularios CRUD
│   │   ├── containers/             # Contenedores de layout
│   │   ├── dashboard/              # Widgets de dashboard
│   │   ├── app-sidebar.tsx         # Barra lateral de navegación
│   │   ├── app-menubar.tsx         # Menú superior
│   │   └── logo-branding.tsx       # Logo y branding
│   ├── hooks/                      # Hooks reutilizables
│   ├── lib/
│   │   ├── auth.server.ts          # Login/logout, verificación de autenticación y roles
│   │   ├── session.server.ts       # Gestión de sesiones con cookies
│   │   ├── hash.server.ts          # Hash y validación de contraseñas (PBKDF2)
│   │   ├── crypt.server.ts         # Cifrado/descifrado AES-256-GCM (Web Crypto)
│   │   ├── platform.server.ts      # Detección de soporte de archivos (DISABLE_FILE_UPLOADS)
│   │   ├── env.server.ts            # Helper getEnv() para Workers + Node.js
│   │   ├── database/               # Clases de acceso a datos (CRUD por entidad)
│   │   ├── services/               # Lógica de negocio
│   │   ├── schemas/                # Esquemas de validación Zod
│   │   └── columns/                # Definiciones de columnas para tablas
│   └── types/
│       └── env.d.ts
├── db/
│   ├── schema.ts                   # Esquema Drizzle (12 tablas, 4 enums, 18 relaciones)
│   ├── enums.ts                    # Enums como const + tipo
│   ├── client.ts                   # createLocalDb() + createD1Db()
│   ├── server.ts                   # Proxy singleton con initLocalDb() + initDb()
│   └── migrations/                 # Migraciones Drizzle (0000_hard_dazzler.sql)
├── worker/
│   └── index.ts                    # Entry point para Cloudflare Workers
├── wrangler.jsonc                  # Configuración de Wrangler (D1 binding, assets, vars) 
├── .env.example                    # Plantilla de variables de entorno
├── .dev.vars                       # Secrets para desarrollo local con Wrangler
└── scripts/                        # Scripts auxiliares
```

## Funcionalidades principales

### Roles de usuario y dashboards

El sistema cuenta con 6 roles con dashboards y permisos segmentados:

| Rol | Funciones |
|---|---|
| **ADMIN** | Gestión completa: usuarios, sitios, departamentos, empresas, categorías de trabajo, trabajadores externos, registros de acceso, accesos planificados, bitácora de auditoría |
| **ACCESS_OPERATOR** | Portería: registro de entradas/salidas con captura de firma digital, visualización de accesos del día y accesos planificados aprobados |
| **ACCESS_MONITOR** | Panel de monitoreo en tiempo real (solo lectura) |
| **SECURITY_MANAGER** | Supervisión de seguridad: registros de acceso, accesos planificados, trabajadores externos, bitácora |
| **ACCESS_APPROVER** | Aprobación/rechazo de solicitudes de acceso planificado |
| **ACCESS_REQUESTER** | Creación y gestión de solicitudes de acceso planificado |

### Registro de accesos con firma digital

- Registro de entrada y salida con datos personales, motivo de visita, vehículo y empresa
- Captura de firma digital al ingreso y egreso mediante canvas
- Firmas almacenadas como sobres cifrados (AES-256-GCM)
- Identificaciones personales (legalId) almacenadas cifradas

### Accesos planificados

- Flujo de aprobación: `PENDING_APPROVAL` → `APPROVED`/`REJECTED` → `USED`/`EXPIRED`/`CANCELED`
- Registro por persona dentro de un acceso grupal
- Estados: pendiente, aprobado, rechazado, cancelado, expirado, usado, parcialmente usado

### Trabajadores externos

- Registro de trabajadores externos vinculados a empresas y categorías de trabajo
- Gestión de documentos: identificaciones y certificados de capacitación
- Control de vencimiento de documentos con verificación automática

### Bitácora de auditoría

Registro automático de operaciones sensibles con detalle de entidad, acción, usuario y metadata.

### APIs de dashboard

Endpoints para widgets en tiempo real:
- Conteo de personas dentro de la instalación
- Conteo de accesos del día
- Estado de accesos planificados
- Último acceso registrado

## Usuarios de prueba

**Contraseña para todos:** `demo123`

| Usuario | Rol |
|---|---|
| `admin` | ADMIN |
| `porteria` | ACCESS_OPERATOR |
| `solicitante` | ACCESS_REQUESTER |
| `aprobador` | ACCESS_APPROVER |
| `visor` | ACCESS_MONITOR |
| `director` | ADMIN |

Para iniciar sesión:

1. Configura las variables de entorno en `.env`
2. Ejecuta `pnpm db:seed`
3. Accede a `http://localhost:5173/login` con cualquiera de los usuarios anteriores y contraseña `demo123`
