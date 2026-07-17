# Wachiman

Sistema de control de acceso industrial para el registro, monitoreo y gestión de entradas y salidas de personal, visitantes y trabajadores externos en instalaciones de planta. Incluye captura de firmas digitales, flujo de aprobación de accesos planificados y dashboards segmentados por rol de usuario.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| **Runtime** | Node.js 24 |
| **Framework** | React Router v7 (SSR + rutas API) |
| **Frontend** | React 19, Tailwind CSS 4, shadcn/ui |
| **Lenguaje** | TypeScript |
| **Base de datos** | PostgreSQL |
| **ORM** | Prisma |
| **Autenticación** | Sesiones por cookie con scrypt |
| **Cifrado** | AES-256-GCM |
| **Contenedores** | Docker |

## Instalación y ejecución

### Requisitos previos

- Node.js 24
- pnpm 10.12+
- PostgreSQL 18

### 1. Variables de entorno

Copia el archivo de ejemplo y configura las variables:

```bash
cp .env.example .env
```

El seed usa la contraseña por defecto `demo123` para todos los usuarios de prueba.

Variables obligatorias:

| Variable | Descripción |
|---|---|
| `ENCRIPTION_KEY` | Clave AES-256-GCM en base64 (generar con `pnpm run env:set-encryption-key`) |
| `SESSION_SECRET` | Secreto para firmar cookies de sesión (generar con `pnpm run env:set-session-secret`) |
| `DATABASE_URL` | URL de conexión a PostgreSQL |

Variables opcionales con valores por defecto en el seed:

| Variable | Valor por defecto |
|---|---|
| `ADMIN_FULL_NAME` | `Administrador` |
| `ADMIN_USERNAME` | `admin` |
| `SITE_NAME` | `Sitio principal` |
| `SITE_SLUG` | `PRINCIPAL` |
| `DEPARTMENT_NAME` | `General` |
| `DEPARTMENT_SLUG` | `GENERAL` |

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Configurar la base de datos

```bash
pnpm db:migrate          # Ejecutar migraciones
pnpm db:seed             # Crear usuario admin inicial (usuario: admin, contraseña: demo123)
```

Para poblar la aplicación con datos demo realistas:

```bash
pnpm db:seed-populate
```

### 4. Iniciar en desarrollo

```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:5173`.

### 5. Construcción para producción

```bash
pnpm build
pnpm start
```

### Docker Compose

El proyecto incluye `docker-compose.yml` con servicios de PostgreSQL y la aplicación:

```bash
docker compose up -d
```

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
│   │   ├── hash.server.ts          # Hash y validación de contraseñas (scrypt)
│   │   ├── crypt.server.ts         # Cifrado/descifrado AES-256-GCM
│   │   ├── prisma.server.ts        # Cliente singleton de Prisma
│   │   ├── utils.ts                # Utilidades generales
│   │   ├── database/               # Clases de acceso a datos (CRUD por entidad)
│   │   ├── services/               # Lógica de negocio
│   │   ├── schemas/                # Esquemas de validación Zod
│   │   └── columns/                # Definiciones de columnas para tablas
│   └── types/
│       └── env.d.ts
├── prisma/
│   ├── schema.prisma               # Esquema de base de datos (15 modelos, 4 enums)
│   ├── seed.ts                     # Seeder inicial (admin, sitio, departamento)
│   ├── seed-populate.ts            # Seeder de datos demo completos
│   └── migrations/                 # Historial de migraciones
├── docker-compose.yml
├── Dockerfile
├── .env.example                    # Plantilla de variables de entorno
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

## Usuario y contraseña de prueba

El seed (`db:seed`) crea un usuario administrador inicial. Para datos demo completos con múltiples roles ejecuta `db:seed-populate`.

**Contraseña común para todos los usuarios:** `demo123`

| Usuario | Rol |
|---|---|
| `admin` | ADMIN |
| `admin.principal` | ADMIN |
| `operador.principal` | ACCESS_OPERATOR |
| `operador.almacen` | ACCESS_OPERATOR |
| `operador.cd` | ACCESS_OPERATOR |
| `monitor.principal` | ACCESS_MONITOR |
| `segur.principal` | SECURITY_MANAGER |
| `aprobador.principal` | ACCESS_APPROVER |
| `solicitante.principal` | ACCESS_REQUESTER |
| `solicitante.norte` | ACCESS_REQUESTER |

Para iniciar sesión:

1. Configura las variables de entorno en `.env`
2. Ejecuta `pnpm db:seed` (o `pnpm db:seed-populate` para datos demo)
3. Accede a `http://localhost:5173/login` con cualquiera de los usuarios anteriores y contraseña `demo123`
