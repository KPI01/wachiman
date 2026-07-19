# Wachiman — Demostración

## Enlace a la presentación

[Ver diapositivas](https://docs.google.com/presentation/d/1WKexqDzOq1EyvmUZdhAC3LrWTSUXuFsu/edit?usp=sharing&ouid=100727549007529328567&rtpof=true&sd=true)

## URL de la aplicación

```
https://wachiman.jorgelurd11-557.workers.dev
```

## Usuarios de prueba

| Usuario | Rol | Contraseña |
|---|---|---|
| `admin` | Administrador | `demo123` |
| `porteria` | Operador (registra entradas/salidas) | `demo123` |
| `solicitante` | Solicitante (crea solicitudes de acceso) | `demo123` |
| `aprobador` | Aprobador (valida y aprueba solicitudes) | `demo123` |
| `visor` | Monitor (visualiza accesos en tiempo real) | `demo123` |
| `director` | Director (acceso total al sistema) | `demo123` |

## Guion del video

### Flujo demostrado

1. **Inicio de sesión** — Acceder con cualquiera de los usuarios de prueba.

2. **Crear solicitud de acceso** (usuario `solicitante`)
   - Ir a "Solicitudes de acceso" en el menú lateral.
   - Completar los datos de la empresa, visitantes, motivo y fechas.
   - Seleccionar el centro (sitio) donde se realizará el acceso.
   - Enviar la solicitud. Queda en estado "Pendiente de aprobación".

3. **Aprobar solicitud** (usuario `aprobador`)
   - Ir a "Solicitudes de acceso" y localizar la solicitud creada.
   - Validar la documentación de los trabajadores externos asociados:
     - El sistema verifica automáticamente que cada persona tenga su documentación de identificación vigente.
     - Si la categoría de trabajo lo requiere, también verifica la formación.
     - Si hay documentos vencidos o faltantes, la aprobación se bloquea.
   - Una vez validada, aprobar la solicitud.

4. **Registrar entrada** (usuario `porteria`)
   - Ir a la pantalla de registro de acceso.
   - Buscar la solicitud aprobada y seleccionar a la persona que ingresa.
   - Registrar la firma digital del visitante.
   - El sistema guarda el registro con timestamp y firma encriptada.

5. **Panel de control** (usuario `visor` o `director`)
   - Visualizar en tiempo real las personas dentro del centro.
   - Ver estadísticas de accesos del día.
   - Consultar el historial completo de entradas y salidas.

### Cierre del video

*"Y con esto terminamos la demostración de Wachiman.*

*Hemos visto el flujo completo de gestión de accesos: desde la creación de una solicitud planificada por parte del solicitante, pasando por la validación automática de documentación — donde el sistema verifica que cada trabajador externo tenga su identificación y formación vigentes antes de permitir la aprobación — hasta la aprobación por parte del aprobador y el registro de entrada por parte del operador en el centro.*

*La aplicación permite tener trazabilidad completa de quién entra, cuándo y por qué motivo, con firmas digitales encriptadas, validación de documentos de trabajadores externos, y paneles de control en tiempo real para cada rol.*

*Todo esto corriendo sobre Cloudflare Workers con D1 como base de datos, desplegado en el edge para máxima velocidad y disponibilidad.*

*Gracias por ver la demo."*
