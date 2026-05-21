# Variantes de Registro de Accesos: Personas y Vehículos con Tripulantes

> **Para Hermes:** usar `subagent-driven-development` si se implementa este plan tarea por tarea.

**Goal:** Separar el registro de accesos en dos variantes: acceso individual de persona y acceso de vehículo con uno o varios tripulantes.

**Architecture:** El modelo actual `AccessLog` mezcla la persona visitante con datos opcionales de vehículo. La propuesta es introducir un concepto explícito de “evento de acceso” con tipo `PERSON` o `VEHICLE`, donde el acceso individual conserva el flujo actual y el acceso vehicular registra primero el vehículo y luego una lista de tripulantes asociados. Esto permite representar correctamente un vehículo con varias personas sin duplicar el vehículo ni forzar un solo visitante principal.

**Tech Stack:** React Router 7, Prisma 7, SQLite, Zod, React 19, TypeScript.

---

## Contexto actual

Archivos revisados:

- `prisma/schema.prisma`
- `app/lib/services/access-log.server.ts`
- `app/lib/database/access-log.server.ts`
- `app/lib/schemas/access-log.ts`
- `app/components/models/access-logs/create-access-log-form.tsx`
- `app/routes/operator/home.tsx`
- `app/routes/security/access-logs.tsx`
- `app/routes/admin/access-logs.tsx`

Situación actual:

- `AccessLog` representa una entrada de persona.
- `AccessLog` tiene datos snapshot de persona: `legalIdSnapshot`, nombres, empresa, teléfono, motivo.
- `AccessLog` puede tener `withVehicle = true` y enlazar a `AccessLogVehicle`.
- `AccessLogVehicle` puede estar enlazado a varios `AccessLog[]`, pero el formulario actual solo crea una persona con un vehículo opcional.
- La firma de entrada está en el `AccessLog` individual.
- La salida se marca sobre un `AccessLog` individual.
- No hay tests existentes detectados (`*.test.*` / `*.spec.*`).

Problema:

- Un vehículo puede tener varias personas.
- El diseño de UI actual pregunta “persona + vehículo opcional”, pero operacionalmente tiene más sentido “vehículo + tripulantes”.
- Si se registran varios tripulantes hoy, se duplicaría información del mismo vehículo o quedaría ambiguo cuál registro representa el acceso vehicular real.

---

## Decisión de diseño recomendada

### Mantener `AccessLog` como la entidad de “persona dentro/fuera”

Para evitar una migración excesivamente grande, mantener `AccessLog` como la unidad que responde a:

- ¿Esta persona está dentro?
- ¿Esta persona ya salió?
- ¿Quién firmó entrada/salida?
- ¿Quién registró su acceso?

### Convertir `AccessLogVehicle` en el agrupador de acceso vehicular

Cuando el formulario sea de tipo vehículo:

1. Se crea un `AccessLogVehicle` con matrícula, tipo, marca, modelo.
2. Se crean N `AccessLog`, uno por tripulante.
3. Todos los `AccessLog` apuntan al mismo `vehicleAccessLogId`.
4. Cada tripulante mantiene su propio DNI/NIE, nombre, empresa, teléfono, motivo y firma.

Esto aprovecha que el schema actual ya tiene:

```prisma
model AccessLogVehicle {
  id            String      @id @default(uuid())
  typeSnapshot  String
  brandSnapshot String?
  modelSnapshot String?
  plateSnapshot String
  accessLogs    AccessLog[]
}
```

Pero conviene reforzarlo con timestamps y quizá relación de salida vehicular si más adelante se necesita.

### Variante 1: Acceso de persona

Formulario simple:

- Tipo: `PERSON`
- Fecha/hora de ingreso
- Centro
- DNI/NIE
- Nombre
- Apellidos
- Teléfono
- Empresa
- Motivo de visita
- Firma

No muestra campos de vehículo.

### Variante 2: Acceso de vehículo con tripulantes

Formulario por pasos recomendado:

1. Elegir “Vehículo con tripulantes”.
2. Datos del vehículo:
   - Tipo de vehículo
   - Matrícula
   - Marca
   - Modelo
3. Tripulantes:
   - Lista dinámica de personas.
   - Cada tripulante tiene DNI/NIE, nombre, apellidos, teléfono, empresa, motivo.
   - Debe haber al menos un tripulante.
   - Botón “Agregar tripulante”.
   - Botón “Eliminar tripulante”, deshabilitado si solo queda uno.
4. Confirmación/firma:
   - Opción recomendada inicial: una firma por tripulante, porque cada `AccessLog` sigue siendo un registro personal.
   - Opción alternativa si se quiere simplificar operación: una firma general del conductor/responsable y replicarla en todos los tripulantes, pero esto pierde precisión legal/auditable.

Recomendación: implementar primero una firma por tripulante si el objetivo es trazabilidad correcta. Si operativamente es demasiado lento, discutir una firma única del responsable.

---

## Reglas de negocio propuestas

1. En acceso individual, se impide crear una entrada si esa persona ya tiene una entrada abierta en el mismo centro.
2. En acceso vehicular, se valida esa misma regla para cada tripulante.
3. En acceso vehicular, se debe rechazar el formulario completo si cualquier tripulante ya está dentro.
4. En acceso vehicular, se debe rechazar si hay tripulantes duplicados dentro del mismo formulario.
5. La matrícula debe normalizarse a mayúsculas y sin espacios/guiones si se decide usarla para búsquedas.
6. El DNI/NIE debe normalizarse a mayúsculas y sin espacios/guiones internos.
7. Para el primer cambio, no bloquearía por “vehículo ya dentro” salvo que el negocio lo pida explícitamente. Puede existir un caso real donde el mismo vehículo salga y entre, o se corrija un registro. Pero sí conviene mostrar advertencia si existe una entrada vehicular abierta para esa matrícula.
8. La salida se puede manejar inicialmente por persona, como ahora. En una fase posterior puede agregarse “marcar salida de todo el vehículo” para cerrar todos los tripulantes asociados.

---

## Modelo de datos propuesto

### Opción A — Cambio incremental recomendado

Mantener los modelos principales y agregar campos mínimos.

Modificar `prisma/schema.prisma`:

```prisma
enum AccessLogKind {
  PERSON
  VEHICLE_OCCUPANT
}

model AccessLog {
  id                     String        @id @default(uuid())
  kind                   AccessLogKind @default(PERSON)
  entryTimestamp         DateTime
  entrySignatureEnvelope Json
  exitTimestamp          DateTime?
  exitSignatureEnvelope  Json?
  companyNameSnapshot    String
  firstNameSnapshot      String
  middleNameSnapshot     String?
  lastNameSnapshot       String
  secondLastNameSnapshot String?
  phoneNumber            String?
  legalIdSnapshot        String
  withVehicle            Boolean       @default(false)
  visitReason            String

  siteId             String
  site               Site              @relation(fields: [siteId], references: [id])
  createdById        String
  createdBy          User              @relation(name: "createdBy", fields: [createdById], references: [id])
  exitRecordedById   String?
  exitRecordedBy     User?             @relation(name: "exitRecordedBy", fields: [exitRecordedById], references: [id])
  vehicleAccessLogId String?
  vehicleAccessLog   AccessLogVehicle? @relation(fields: [vehicleAccessLogId], references: [id])

  @@index([siteId, legalIdSnapshot, exitTimestamp])
  @@index([vehicleAccessLogId])
}

model AccessLogVehicle {
  id             String      @id @default(uuid())
  createdAt      DateTime    @default(now())
  typeSnapshot   String
  brandSnapshot  String?
  modelSnapshot  String?
  plateSnapshot  String
  accessLogs     AccessLog[]

  @@index([plateSnapshot])
}
```

Notas:

- `kind = PERSON`: acceso individual.
- `kind = VEHICLE_OCCUPANT`: tripulante de vehículo.
- `withVehicle` queda por compatibilidad, pero a mediano plazo podría eliminarse porque `vehicleAccessLogId != null` ya indica que pertenece a vehículo.
- Agregar índices ayuda a consultas y evita búsquedas lentas.

### Índice único parcial recomendado para evitar duplicidad de entrada

Prisma puede no expresar cómodamente índices únicos parciales para SQLite, así que añadirlo en SQL de migración:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS "AccessLog_one_open_person_per_site"
ON "AccessLog"("siteId", "legalIdSnapshot")
WHERE "exitTimestamp" IS NULL;
```

Esto arregla la debilidad detectada previamente: dos accesos abiertos para la misma persona en el mismo centro.

---

## Cambios por archivo

### `prisma/schema.prisma`

Cambios:

- Agregar enum `AccessLogKind`.
- Agregar `kind` a `AccessLog`.
- Agregar `createdAt` e índices a `AccessLogVehicle`.
- Agregar índices a `AccessLog`.

### Nueva migración Prisma

Crear con:

```bash
pnpm prisma migrate dev --name access-log-person-vehicle-variants
```

Luego editar el SQL generado para añadir el índice único parcial:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS "AccessLog_one_open_person_per_site"
ON "AccessLog"("siteId", "legalIdSnapshot")
WHERE "exitTimestamp" IS NULL;
```

### `app/lib/schemas/access-log.ts`

Cambios:

- Separar schemas:
  - `createPersonAccessLogSchema`
  - `createVehicleAccessLogSchema`
- Mantener export de compatibilidad si hace falta.
- Crear schema de tripulante.
- Normalizar DNI/NIE.
- Normalizar matrícula.
- Validar al menos un tripulante.
- Validar duplicados dentro del formulario.

Ejemplo conceptual:

```ts
const normalizeLegalId = (value: string) =>
  value.trim().toUpperCase().replace(/[\s-]/g, "");

const normalizePlate = (value: string) =>
  value.trim().toUpperCase().replace(/[\s-]/g, "");

const occupantSchema = z.object({
  firstNameSnapshot: requiredString,
  middleNameSnapshot: optionalString,
  lastNameSnapshot: requiredString,
  secondLastNameSnapshot: optionalString,
  phoneNumber: optionalString,
  legalIdSnapshot: requiredString.transform(normalizeLegalId),
  companyNameSnapshot: requiredString,
  visitReason: requiredString,
  entrySignaturePayload: signaturePayloadFromStringSchema,
});

export const createVehicleAccessLogSchema = z.object({
  accessType: z.literal("VEHICLE"),
  entryTimestamp: z.coerce.date(),
  siteId: requiredString,
  vehicleTypeSnapshot: requiredString,
  vehicleBrandSnapshot: optionalString,
  vehicleModelSnapshot: optionalString,
  vehiclePlateSnapshot: requiredString.transform(normalizePlate),
  occupants: z.array(occupantSchema).min(1, "Debe agregar al menos un tripulante."),
});
```

### `app/lib/database/access-log.server.ts`

Cambios:

- Agregar método para buscar personas con entrada abierta:
  - `findOpenByLegalIds(siteId, legalIds)`
- Agregar método transaccional para crear acceso vehicular:
  - `createVehicleAccess(data)`
- Modificar `create` para aceptar `kind` o crear método específico de persona.

Métodos propuestos:

```ts
public static async findOpenByLegalIds(siteId: string, legalIds: string[]) {
  return await prisma.accessLog.findMany({
    where: {
      siteId,
      legalIdSnapshot: { in: legalIds },
      exitTimestamp: null,
    },
    select: {
      id: true,
      legalIdSnapshot: true,
      firstNameSnapshot: true,
      lastNameSnapshot: true,
    },
  });
}
```

```ts
public static async createVehicleAccess(data: CreateVehicleAccessLogInput) {
  return await prisma.$transaction(async (tx) => {
    const vehicleAccessLog = await tx.accessLogVehicle.create({
      data: {
        typeSnapshot: data.vehicle.typeSnapshot,
        brandSnapshot: data.vehicle.brandSnapshot,
        modelSnapshot: data.vehicle.modelSnapshot,
        plateSnapshot: data.vehicle.plateSnapshot,
      },
    });

    await tx.accessLog.createMany({
      data: data.occupants.map((occupant) => ({
        kind: "VEHICLE_OCCUPANT",
        entryTimestamp: data.entryTimestamp,
        entrySignatureEnvelope: occupant.entrySignatureEnvelope,
        companyNameSnapshot: occupant.companyNameSnapshot,
        firstNameSnapshot: occupant.firstNameSnapshot,
        middleNameSnapshot: occupant.middleNameSnapshot,
        lastNameSnapshot: occupant.lastNameSnapshot,
        secondLastNameSnapshot: occupant.secondLastNameSnapshot,
        phoneNumber: occupant.phoneNumber,
        legalIdSnapshot: occupant.legalIdSnapshot,
        withVehicle: true,
        visitReason: occupant.visitReason,
        siteId: data.siteId,
        createdById: data.createdById,
        vehicleAccessLogId: vehicleAccessLog.id,
      })),
    });

    return vehicleAccessLog;
  });
}
```

Nota: si `createMany` no admite todos los tipos como se espera con Prisma/SQLite, usar `Promise.all(data.occupants.map(...tx.accessLog.create...))` dentro de la transacción.

### `app/lib/services/access-log.server.ts`

Cambios:

- Renombrar o separar servicios:
  - `createPersonAccessLog`
  - `createVehicleAccessLog`
  - `createAccessLog` como dispatch según `accessType`
- Sustituir `isPersonAlreadyInside` para no filtrar solo por fecha.
- Validar duplicados abiertos para todos los tripulantes antes de crear.
- Capturar error de índice único parcial y devolver mensaje amigable.

Servicio recomendado:

```ts
export async function createAccessLog(input, options) {
  const accessType = input.accessType === "VEHICLE" ? "VEHICLE" : "PERSON";

  if (accessType === "VEHICLE") {
    return await createVehicleAccessLog(input, options);
  }

  return await createPersonAccessLog(input, options);
}
```

### `app/components/models/access-logs/create-access-log-form.tsx`

Cambios grandes de UI:

- Agregar estado `accessType: "PERSON" | "VEHICLE"`.
- Mostrar selector inicial con dos tarjetas/botones:
  - “Persona”
  - “Vehículo con tripulantes”
- Extraer subcomponentes internos o nuevos archivos:
  - `person-access-fields.tsx`
  - `vehicle-fields.tsx`
  - `occupants-fields.tsx`
  - `access-log-signature` ya existe y se reutiliza.

Recomendación de composición:

```txt
create-access-log-form.tsx
  ├─ AccessTypeSelector
  ├─ PersonAccessFields
  ├─ VehicleAccessFields
  ├─ OccupantsFields
  └─ Signature step
```

Para no hacer un componente gigante, crear nuevos componentes en:

- `app/components/models/access-logs/person-access-fields.tsx`
- `app/components/models/access-logs/vehicle-access-fields.tsx`
- `app/components/models/access-logs/occupants-fields.tsx`

### Rutas

#### `app/routes/operator/home.tsx`

- Puede seguir usando el mismo `CreateAccessLogForm`.
- El `lockedSiteId` debe aplicar tanto a persona como a vehículo.

#### `app/routes/admin/access-logs.tsx`

- Ya retorna `createAccessLog`; mantener.

#### `app/routes/security/access-logs.tsx`

Corregir bug existente:

Actualmente el action calcula `result` pero no retorna nada.

Cambiar:

```ts
const result = await createAccessLog(data, { authorUsername: user.username });
```

Por:

```ts
return await createAccessLog(data, { authorUsername: user.username });
```

### `app/lib/columns/access-log.tsx`

Cambios:

- Mostrar si el registro es persona individual o tripulante de vehículo.
- Para tripulantes, mostrar matrícula/tipo si existe `vehicleAccessLog`.
- Revisar columna `vehicleDetails` existente.

---

## Plan de implementación por tareas

### Task 1: Crear migración para distinguir persona vs tripulante

**Objective:** Agregar `AccessLogKind` y metadatos mínimos para vehículos.

**Files:**

- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_access_log_person_vehicle_variants/migration.sql`

**Steps:**

1. Agregar enum `AccessLogKind` en `schema.prisma`.
2. Agregar `kind AccessLogKind @default(PERSON)` en `AccessLog`.
3. Agregar índices `@@index([siteId, legalIdSnapshot, exitTimestamp])` y `@@index([vehicleAccessLogId])`.
4. Agregar `createdAt DateTime @default(now())` e `@@index([plateSnapshot])` en `AccessLogVehicle`.
5. Ejecutar:

```bash
pnpm prisma migrate dev --name access_log_person_vehicle_variants
```

6. Añadir manualmente al SQL generado:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS "AccessLog_one_open_person_per_site"
ON "AccessLog"("siteId", "legalIdSnapshot")
WHERE "exitTimestamp" IS NULL;
```

7. Ejecutar:

```bash
pnpm typecheck
```

Expected: typecheck pasa o muestra errores relacionados con generated client que deben resolverse regenerando Prisma.

---

### Task 2: Normalizar DNI/NIE y matrícula en schemas

**Objective:** Evitar duplicados por diferencias de formato.

**Files:**

- Modify: `app/lib/schemas/access-log.ts`

**Steps:**

1. Crear helpers `normalizeLegalId` y `normalizePlate`.
2. Cambiar `legalIdSnapshot` para usar `normalizeLegalId`.
3. Cambiar `vehiclePlateSnapshot` para usar `normalizePlate`.
4. Mantener mensajes de error actuales.
5. Ejecutar:

```bash
pnpm typecheck
pnpm lint
```

Expected: sin errores nuevos.

---

### Task 3: Separar schemas de persona y vehículo

**Objective:** Tener validaciones distintas para acceso individual y acceso vehicular.

**Files:**

- Modify: `app/lib/schemas/access-log.ts`

**Steps:**

1. Extraer `signaturePayloadSchema` y `signaturePayloadFromStringSchema` como ya están.
2. Crear `occupantSchema`.
3. Crear `createPersonAccessLogSchema`.
4. Crear `createVehicleAccessLogSchema`.
5. Crear `createAccessLogSchema` como unión discriminada por `accessType`:

```ts
export const createAccessLogSchema = z.discriminatedUnion("accessType", [
  createPersonAccessLogSchema,
  createVehicleAccessLogSchema,
]);
```

6. Para compatibilidad, el formulario individual debe enviar `accessType=PERSON`.
7. Ejecutar:

```bash
pnpm typecheck
```

Expected: errores en el servicio porque todavía espera campos planos; se corrigen en tareas siguientes.

---

### Task 4: Agregar métodos de base de datos para entradas abiertas y acceso vehicular

**Objective:** Preparar persistencia de N tripulantes asociados al mismo vehículo.

**Files:**

- Modify: `app/lib/database/access-log.server.ts`

**Steps:**

1. Agregar type `CreateVehicleAccessLogInput`.
2. Agregar `AccessLogEntity.findOpenByLegalIds(siteId, legalIds)`.
3. Agregar `AccessLogEntity.createVehicleAccess(data)` con transacción.
4. Modificar `CreateAccessLogInput` para aceptar `kind?: "PERSON" | "VEHICLE_OCCUPANT"` si hace falta.
5. Asegurar que `DEFAULT_INCLUDE` ya incluye `vehicleAccessLog`; conservarlo.
6. Ejecutar:

```bash
pnpm typecheck
```

Expected: compila o quedan errores de servicio pendientes.

---

### Task 5: Separar servicio de creación en persona y vehículo

**Objective:** Centralizar la lógica de negocio para ambas variantes.

**Files:**

- Modify: `app/lib/services/access-log.server.ts`

**Steps:**

1. Reemplazar `isPersonAlreadyInside(siteId, legalId)` por una consulta de entrada abierta sin fecha.
2. Crear `createPersonAccessLog(input, options)`.
3. Crear `createVehicleAccessLog(input, options)`.
4. Hacer que `createAccessLog(input, options)` despache por `accessType`.
5. En vehículo:
   - Validar usuario creador.
   - Resolver `siteId` con `lockedSiteId ?? data.siteId`.
   - Detectar documentos duplicados dentro de `data.occupants`.
   - Consultar entradas abiertas con `findOpenByLegalIds`.
   - Si existe alguna, devolver error con lista de documentos/nombres.
   - Crear `AccessLogVehicle` y los `AccessLog` en una transacción.
6. Capturar error de índice único para devolver mensaje amigable si hay carrera.
7. Ejecutar:

```bash
pnpm typecheck
pnpm lint
```

Expected: sin errores nuevos.

---

### Task 6: Corregir retorno del action de seguridad

**Objective:** Asegurar que `SECURITY_MANAGER` reciba errores de validación.

**Files:**

- Modify: `app/routes/security/access-logs.tsx`

**Steps:**

1. Cambiar el action para retornar el resultado de `createAccessLog`.
2. Ejecutar:

```bash
pnpm typecheck
```

Expected: sin errores.

---

### Task 7: Dividir el formulario en subcomponentes

**Objective:** Evitar que `create-access-log-form.tsx` se vuelva inmanejable.

**Files:**

- Modify: `app/components/models/access-logs/create-access-log-form.tsx`
- Create: `app/components/models/access-logs/access-type-selector.tsx`
- Create: `app/components/models/access-logs/person-access-fields.tsx`
- Create: `app/components/models/access-logs/vehicle-access-fields.tsx`
- Create: `app/components/models/access-logs/occupants-fields.tsx`

**Steps:**

1. Crear `AccessTypeSelector` con dos opciones visuales.
2. Extraer campos actuales de persona a `PersonAccessFields`.
3. Extraer campos vehiculares a `VehicleAccessFields`.
4. Crear `OccupantsFields` con lista dinámica.
5. Mantener el paso de firma existente inicialmente para persona individual.
6. Ejecutar:

```bash
pnpm typecheck
```

Expected: sin errores de props/imports.

---

### Task 8: Implementar flujo UI para acceso individual

**Objective:** Mantener comportamiento actual, pero sin vehículo opcional.

**Files:**

- Modify: `app/components/models/access-logs/create-access-log-form.tsx`
- Modify: `app/components/models/access-logs/person-access-fields.tsx`

**Steps:**

1. Agregar hidden input `accessType=PERSON`.
2. Remover checkbox “El acceso fue realizado con vehículo” del flujo persona.
3. Enviar únicamente campos de persona y firma.
4. Probar manualmente crear un acceso individual.
5. Ejecutar:

```bash
pnpm typecheck
pnpm lint
```

Expected: acceso individual funciona como antes, pero sin campos de vehículo.

---

### Task 9: Implementar flujo UI para vehículo con tripulantes

**Objective:** Permitir registrar un vehículo con N ocupantes.

**Files:**

- Modify: `app/components/models/access-logs/create-access-log-form.tsx`
- Modify: `app/components/models/access-logs/vehicle-access-fields.tsx`
- Modify: `app/components/models/access-logs/occupants-fields.tsx`

**Steps:**

1. Agregar hidden input `accessType=VEHICLE`.
2. Agregar campos de vehículo.
3. Agregar estado `occupants` con al menos un ocupante.
4. Permitir agregar/eliminar tripulantes.
5. Nombrar campos para que el backend pueda reconstruir array.

Opción recomendada para serialización simple:

- Mantener estado de ocupantes en React.
- En submit, incluir un hidden input `occupantsJson` con JSON.
- El schema transforma `occupantsJson` a array.

Alternativa con nombres tipo `occupants[0].legalIdSnapshot` requiere adaptar `getFormData` si actualmente devuelve objeto plano.

6. Reutilizar `AccessLogSignature` por tripulante o implementar paso secuencial de firmas.
7. Ejecutar:

```bash
pnpm typecheck
pnpm lint
```

Expected: formulario renderiza y envía payload de vehículo.

---

### Task 10: Adaptar `getFormData` si se usa JSON de ocupantes

**Objective:** Garantizar que backend reciba correctamente arrays de tripulantes.

**Files:**

- Modify: `app/lib/services/http.server.ts`
- Modify: `app/lib/schemas/access-log.ts`

**Steps:**

1. Leer implementación actual de `getFormData`.
2. Si devuelve objeto plano, preferir `occupantsJson`.
3. En schema vehicular, parsear `occupantsJson`:

```ts
occupantsJson: requiredString.transform((value, context) => {
  try {
    return JSON.parse(value);
  } catch {
    context.addIssue({ code: "custom", message: "Tripulantes inválidos." });
    return z.NEVER;
  }
}).pipe(z.array(occupantSchema).min(1))
```

4. Transformar el resultado a `occupants` para el servicio.
5. Ejecutar:

```bash
pnpm typecheck
```

Expected: backend recibe array válido.

---

### Task 11: Actualizar columnas/listado para distinguir registros

**Objective:** Que el usuario entienda qué registros son individuales y cuáles son tripulantes de un vehículo.

**Files:**

- Modify: `app/lib/columns/access-log.tsx`

**Steps:**

1. Añadir badge/columna para `kind`.
2. Mostrar “Persona” para `PERSON`.
3. Mostrar “Tripulante” para `VEHICLE_OCCUPANT`.
4. En detalles de vehículo, mostrar matrícula/tipo desde `vehicleAccessLog`.
5. Ejecutar:

```bash
pnpm typecheck
pnpm lint
```

Expected: tabla renderiza sin errores.

---

### Task 12: Validación manual completa

**Objective:** Probar los casos reales antes de cerrar.

**Files:**

- No code changes unless bugs are found.

**Steps:**

1. Ejecutar servidor:

```bash
pnpm dev
```

2. Probar como operador:
   - Crear acceso individual.
   - Intentar crear el mismo DNI otra vez: debe fallar.
   - Registrar salida.
   - Crear el mismo DNI otra vez: debe permitir.
3. Probar vehículo:
   - Crear vehículo con 1 tripulante.
   - Crear vehículo con 3 tripulantes.
   - Intentar tripulante duplicado dentro del mismo formulario: debe fallar.
   - Intentar tripulante que ya está dentro: debe fallar todo el registro.
4. Probar admin/security:
   - Validar que errores aparecen en UI.
   - Validar que el action de security devuelve errores.
5. Ejecutar:

```bash
pnpm build
pnpm typecheck
pnpm lint
```

Expected: build, typecheck y lint pasan.

---

## Riesgos y decisiones pendientes

### 1. ¿Firma por tripulante o firma única del conductor?

Recomendación técnica/auditable: firma por tripulante.

Ventaja:

- Cada persona tiene evidencia individual.
- Encaja con el modelo actual `AccessLog`.

Desventaja:

- Más lento en portería.

Opción rápida: firma única del conductor/responsable replicada en cada tripulante. No recomendado si la firma tiene valor de consentimiento individual.

### 2. ¿Salida por persona o salida del vehículo completo?

Fase 1: mantener salida por persona.

Fase 2 opcional: botón “Marcar salida de vehículo” que cierre todos los `AccessLog` abiertos asociados al `vehicleAccessLogId`.

### 3. ¿Bloquear matrícula ya dentro?

No lo haría en la primera fase sin confirmación de negocio.

Motivo: la entidad crítica para seguridad suele ser la persona, no el vehículo. Pero si el proceso exige que una matrícula no pueda tener dos accesos abiertos, agregar un índice/validación similar para `plateSnapshot` con vehículos abiertos.

### 4. Serialización del array de tripulantes

Recomendación: usar `occupantsJson` como hidden input para evitar pelear con `FormData` plano y nombres anidados.

---

## Orden recomendado de implementación

1. Backend/schema primero.
2. Servicio y validaciones.
3. Corrección del action de security.
4. UI separada en componentes.
5. Flujo persona.
6. Flujo vehículo.
7. Columnas/listado.
8. Validación manual.

---

## Criterios de aceptación

- El formulario permite elegir “Persona” o “Vehículo con tripulantes”.
- El flujo “Persona” crea un `AccessLog` sin vehículo.
- El flujo “Vehículo con tripulantes” crea un `AccessLogVehicle` y N `AccessLog` asociados.
- Cada tripulante queda visible en la tabla con datos del vehículo.
- Una persona no puede tener dos entradas abiertas en el mismo centro.
- Un formulario vehicular con un tripulante ya dentro no crea registros parciales.
- Los errores se muestran correctamente para operador, admin y security manager.
- `pnpm typecheck`, `pnpm lint` y `pnpm build` pasan.

---

## Comandos de verificación final

```bash
cd /mnt/c/Users/Alfredo/Desarrollos/wachiman
pnpm prisma generate
pnpm typecheck
pnpm lint
pnpm build
```

---

## Nota final

Este plan prioriza un cambio incremental sobre una re-arquitectura total. La alternativa más pura sería crear una entidad nueva `AccessEvent` y separar completamente `AccessPerson`, `AccessVehicle`, `AccessOccupant`, pero eso implicaría una migración más grande y tocar muchas pantallas. Para el estado actual del proyecto, reutilizar `AccessLogVehicle` como agrupador de tripulantes es la opción más pragmática.
