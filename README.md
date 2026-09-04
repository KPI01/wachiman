# Control Accesos Fruveco

Aplicación de control de accesos para Fruveco. Esta rama es una personalización
independiente de la aplicación base y se despliega en el servidor local con
Podman, SQLite y Caddy.

## Desarrollo local

Requisitos: Node.js 24 y pnpm 10.12.4.

```bash
cp .env.local.example .env.local
pnpm install
pnpm db:setup -- --env=.env.local
pnpm build:local
pnpm start:local
```

La aplicación local queda disponible en `http://localhost:3000`.

## Despliegue

La configuración productiva está en `.env.production`, que nunca debe
versionarse. Genera secretos nuevos antes de desplegar:

```bash
cp .env.production.example .env.production
pnpm env:set-encryption-key -- --env .env.production
pnpm env:set-session-secret -- --env .env.production
```

La aplicación se ejecuta en el puerto local `127.0.0.1:3000`. Caddy del host
publica:

```text
https://control-accesos.fruveco.com     -> 127.0.0.1:3000
https://192.168.100.172:8444            -> 127.0.0.1:3000
```

```bash
podman compose build
podman compose run --rm app pnpm db:setup
podman compose up -d
podman compose ps
```

El almacenamiento persistente usa los volúmenes
`control_accesos_sqlite_data` y `control_accesos_uploads_data`.

## Caddy del host

Instala `deploy/host-caddy/control-accesos.caddy` en
`/etc/caddy/sites-enabled/` y valida la configuración antes de recargar el
servicio:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
sudo systemctl reload caddy
```

Los dispositivos deben confiar en la CA interna de Caddy. El certificado raíz
se distribuye manualmente y nunca se incluye en este repositorio.

## Validación

El endpoint público de salud responde con `{"status":"ok"}` y permite
comprobar Caddy, TLS y la aplicación sin iniciar sesión. Define la ruta del
certificado raíz interno antes de validar desde una máquina que no lo tenga
instalado en el almacén de confianza:

```bash
CA_ROOT=/ruta/a/wms-caddy-root.crt

curl --fail --cacert "$CA_ROOT" https://control-accesos.fruveco.com/api/health
curl --fail --cacert "$CA_ROOT" https://192.168.100.172:8444/api/health
curl --fail --cacert "$CA_ROOT" https://control-accesos.fruveco.com/login
```

Después valida en navegador el certificado, el inicio de sesión, las rutas
protegidas, las cargas de documentos y la persistencia de SQLite.
