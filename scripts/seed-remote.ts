import "dotenv/config";
import { hashText } from "../app/lib/hash.server";

const now = new Date();
const nowISO = now.toISOString();
const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const tomorrowMidnight = new Date(todayMidnight);
tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);
const yesterdayMidnight = new Date(todayMidnight);
yesterdayMidnight.setDate(yesterdayMidnight.getDate() - 1);
const twoDaysAgoMidnight = new Date(todayMidnight);
twoDaysAgoMidnight.setDate(twoDaysAgoMidnight.getDate() - 2);
const lastWeekMidnight = new Date(todayMidnight);
lastWeekMidnight.setDate(lastWeekMidnight.getDate() - 7);

function isoDate(d: Date, time?: string) {
  return d.toISOString().split("T")[0] + (time ? `T${time}Z` : "T00:00:00.000Z");
}

const nowISOshort = nowISO;

async function main() {
  const adminPwd = await hashText("demo123");
  const operPwd = await hashText("demo123");
  const monPwd = await hashText("demo123");
  const reqPwd = await hashText("demo123");

  const sql = `
-- ───── SITES ────────────────────────────────────────
INSERT INTO sites (id, name, slug, address, created_at, updated_at) VALUES
('site-1', 'Fabrica 1', 'FAB1', 'Pol. Ind. Oeste, Murcia', '${nowISO}', '${nowISO}'),
('site-2', 'Oficinas Centrales', 'OFC', 'Avda. General 42, Murcia', '${nowISO}', '${nowISO}');

-- ───── DEPARTMENTS ───────────────────────────────────
INSERT INTO departments (id, name, slug, created_at, updated_at) VALUES
('dept-1', 'Seguridad', 'SEG', '${nowISO}', '${nowISO}'),
('dept-2', 'Mantenimiento', 'MANT', '${nowISO}', '${nowISO}'),
('dept-3', 'Administracion', 'ADMIN', '${nowISO}', '${nowISO}'),
('dept-4', 'Produccion', 'PROD', '${nowISO}', '${nowISO}');

-- ───── COMPANIES ─────────────────────────────────────
INSERT INTO companies (id, name, slug, cif, address, phone, email, created_at, updated_at) VALUES
('company-1', 'Construcciones Murcianas SL', 'CONSMUR', 'B-12345678', 'Pol. Ind. San Gines, Murcia', '968123456', 'info@consmur.com', '${nowISO}', '${nowISO}'),
('company-2', 'Grupo Electrica Levante SA', 'GELSA', 'A-87654321', 'Avda. Libertad 23, Murcia', '968654321', 'admin@grupoelectrica.es', '${nowISO}', '${nowISO}'),
('company-3', 'Transportes Martinez SL', 'TRAMAR', 'B-55667788', 'C/ Comercio 15, Murcia', '968112233', 'tfno@tramar.com', '${nowISO}', '${nowISO}');

-- ───── WORK CATEGORIES ───────────────────────────────
INSERT INTO work_categories (id, name, description, requires_special_permission, requires_training, created_at, updated_at) VALUES
('wc-1', 'Electricista', 'Instalacion y mantenimiento electrico', 1, 1, '${nowISO}', '${nowISO}'),
('wc-2', 'Albanil', 'Obra y reformas', 0, 0, '${nowISO}', '${nowISO}'),
('wc-3', 'Soldador', 'Trabajos de soldadura', 1, 1, '${nowISO}', '${nowISO}'),
('wc-4', 'Transportista', 'Carga y descarga de mercancias', 0, 0, '${nowISO}', '${nowISO}'),
('wc-5', 'Tecnico de climatizacion', 'Mantenimiento de climatizacion', 1, 1, '${nowISO}', '${nowISO}');

-- ───── USERS ─────────────────────────────────────────
INSERT INTO users (id, full_name, username, password, role, is_active, is_trashed, site_id, department_id, created_at, updated_at) VALUES
('user-1', 'Administrador', 'admin', '${adminPwd}', 'ADMIN', 1, 0, 'site-1', 'dept-3', '${nowISO}', '${nowISO}'),
('user-2', 'Carlos Segura', 'operador', '${operPwd}', 'ACCESS_OPERATOR', 1, 0, 'site-1', 'dept-1', '${nowISO}', '${nowISO}'),
('user-3', 'Maria Vigilancia', 'monitor', '${monPwd}', 'ACCESS_MONITOR', 1, 0, 'site-2', 'dept-1', '${nowISO}', '${nowISO}'),
('user-4', 'Juan Proveedores', 'proveedores', '${reqPwd}', 'ACCESS_REQUESTER', 1, 0, 'site-1', 'dept-4', '${nowISO}', '${nowISO}');

-- ───── EXTERNAL WORKERS ─────────────────────────────
INSERT INTO external_workers (id, first_name, middle_name, last_name, second_last_name, phone_number, legal_id, company_id, work_category_id, created_at, updated_at) VALUES
('worker-1', 'Antonio', 'Jose', 'Lopez', 'Garcia', '600111222', '12345678A', 'company-1', 'wc-1', '${nowISO}', '${nowISO}'),
('worker-2', 'Maria', NULL, 'Rodriguez', 'Perez', '600222333', '87654321B', 'company-1', 'wc-2', '${nowISO}', '${nowISO}'),
('worker-3', 'Francisco', 'Javier', 'Martinez', 'Lopez', '600333444', '11223344C', 'company-2', 'wc-3', '${nowISO}', '${nowISO}'),
('worker-4', 'Laura', NULL, 'Sanchez', 'Garcia', '600444555', '44332211D', 'company-2', 'wc-5', '${nowISO}', '${nowISO}'),
('worker-5', 'Pedro', NULL, 'Fernandez', 'Martinez', '600555666', '55667788E', 'company-3', 'wc-4', '${nowISO}', '${nowISO}'),
('worker-6', 'Sofia', 'Maria', 'Gonzalez', 'Ramos', '600666777', '99887766F', 'company-3', 'wc-1', '${nowISO}', '${nowISO}');

-- ───── WORKER DOCUMENTS ─────────────────────────────
INSERT INTO worker_documents (id, document_type, status, file_name, file_path, file_size, mime_type, expiry_date, notes, external_worker_id, created_at, updated_at) VALUES
('doc-1', 'IDENTIFICATION', 'VALIDATED', 'DNI_Antonio.pdf', '/var/uploads/workers/worker-1/DNI_Antonio.pdf', 245760, 'application/pdf', '2028-06-15T00:00:00.000Z', NULL, 'worker-1', '${nowISO}', '${nowISO}'),
('doc-2', 'TRAINING', 'VALIDATED', 'Curso_electricidad_2026.pdf', '/var/uploads/workers/worker-1/Curso_electricidad.pdf', 512000, 'application/pdf', '2027-03-20T00:00:00.000Z', NULL, 'worker-1', '${nowISO}', '${nowISO}'),
('doc-3', 'IDENTIFICATION', 'VALIDATED', 'DNI_MariaR.pdf', '/var/uploads/workers/worker-2/DNI_MariaR.pdf', 250000, 'application/pdf', '2029-11-30T00:00:00.000Z', NULL, 'worker-2', '${nowISO}', '${nowISO}'),
('doc-4', 'IDENTIFICATION', 'VALIDATED', 'DNI_Francisco.pdf', '/var/uploads/workers/worker-3/DNI_Francisco.pdf', 240000, 'application/pdf', '2027-08-15T00:00:00.000Z', NULL, 'worker-3', '${nowISO}', '${nowISO}'),
('doc-5', 'TRAINING', 'EXPIRED', 'Curso_soldadura_2024.pdf', '/var/uploads/workers/worker-3/Curso_soldadura_2024.pdf', 480000, 'application/pdf', '2025-01-10T00:00:00.000Z', 'Curso caducado', 'worker-3', '${nowISO}', '${nowISO}'),
('doc-6', 'IDENTIFICATION', 'VALIDATED', 'DNI_Pedro.pdf', '/var/uploads/workers/worker-5/DNI_Pedro.pdf', 235000, 'application/pdf', '2028-05-20T00:00:00.000Z', NULL, 'worker-5', '${nowISO}', '${nowISO}');

-- ───── PLANNED ACCESSES ─────────────────────────────
INSERT INTO planned_accesses (id, expected_start_datetime, expected_end_datetime, status, company_snapshot, visit_reason, approved_by_id, requested_by_id, site_id, created_at, updated_at) VALUES
('pa-1', '${isoDate(tomorrowMidnight, "08:00:00.000")}', '${isoDate(tomorrowMidnight, "18:00:00.000")}', 'APPROVED', 'Construcciones Murcianas SL', 'Reparacion de instalacion electrica en nave 3', 'user-1', 'user-4', 'site-1', '${yesterdayMidnight.toISOString()}', '${nowISO}'),
('pa-2', '${isoDate(tomorrowMidnight, "09:00:00.000")}', NULL, 'PENDING_APPROVAL', 'Grupo Electrica Levante SA', 'Mantenimiento climatizacion oficinas', 'user-1', 'user-4', 'site-2', '${twoDaysAgoMidnight.toISOString()}', '${twoDaysAgoMidnight.toISOString()}'),
('pa-3', '${isoDate(lastWeekMidnight, "08:00:00.000")}', '${isoDate(lastWeekMidnight, "15:00:00.000")}', 'USED', 'Transportes Martinez SL', 'Carga de mercancia en almacen', 'user-1', 'user-4', 'site-1', '${lastWeekMidnight.toISOString()}', '${lastWeekMidnight.toISOString()}');

-- ───── PLANNED ACCESS PERSONS ────────────────────────
INSERT INTO planned_access_persons (id, first_name_snapshot, middle_name_snapshot, last_name_snapshot, second_last_name_snapshot, phone_number, legal_id_snapshot, planned_access_id, external_worker_id, created_at, updated_at) VALUES
('pap-1', 'Antonio', 'Jose', 'Lopez', 'Garcia', '600111222', '12345678A', 'pa-1', 'worker-1', '${nowISO}', '${nowISO}'),
('pap-2', 'Maria', NULL, 'Rodriguez', 'Perez', '600222333', '87654321B', 'pa-1', 'worker-2', '${nowISO}', '${nowISO}'),
('pap-3', 'Francisco', 'Javier', 'Martinez', 'Lopez', '600333444', '11223344C', 'pa-2', 'worker-3', '${nowISO}', '${nowISO}'),
('pap-4', 'Laura', NULL, 'Sanchez', 'Garcia', '600444555', '44332211D', 'pa-2', 'worker-4', '${nowISO}', '${nowISO}'),
('pap-5', 'Pedro', NULL, 'Fernandez', 'Martinez', '600555666', '55667788E', 'pa-3', 'worker-5', '${nowISO}', '${nowISO}'),
('pap-6', 'Sofia', 'Maria', 'Gonzalez', 'Ramos', '600666777', '99887766F', 'pa-3', 'worker-6', '${nowISO}', '${nowISO}');

-- ───── ACCESS LOG VEHICLES ─────────────────────────
INSERT INTO access_log_vehicles (id, type_snapshot, brand_snapshot, model_snapshot, plate_snapshot) VALUES
('vehicle-1', 'Camion', 'Iveco', 'Eurocargo', '1234ABC');

-- ───── ACCESS LOGS ──────────────────────────────────
INSERT INTO access_logs (id, entry_timestamp, entry_signature_envelope, exit_timestamp, exit_signature_envelope, company_name_snapshot, first_name_snapshot, middle_name_snapshot, last_name_snapshot, second_last_name_snapshot, phone_number, legal_id_snapshot, with_vehicle, visit_reason, site_id, created_by_id, vehicle_access_log_id, external_worker_id, planned_access_id, planned_access_person_id) VALUES
('log-1', '${isoDate(yesterdayMidnight, "07:30:00.000")}', '{"v":1,"alg":"aes-256-gcm","iv":"test","tag":"test","ct":"test"}', '${isoDate(yesterdayMidnight, "16:00:00.000")}', '{"v":1,"alg":"aes-256-gcm","iv":"test","tag":"test","ct":"test"}', 'Construcciones Murcianas SL', 'Antonio', 'Jose', 'Lopez', 'Garcia', '600111222', '12345678A', 0, 'Trabajos electricos', 'site-1', 'user-2', NULL, 'worker-1', 'pa-3', 'pap-5'),
('log-2', '${isoDate(yesterdayMidnight, "08:00:00.000")}', '{"v":1,"alg":"aes-256-gcm","iv":"test","tag":"test","ct":"test"}', '${isoDate(yesterdayMidnight, "17:30:00.000")}', '{"v":1,"alg":"aes-256-gcm","iv":"test","tag":"test","ct":"test"}', 'Transportes Martinez SL', 'Pedro', NULL, 'Fernandez', 'Martinez', '600555666', '55667788E', 1, 'Transporte de materiales', 'site-1', 'user-2', 'vehicle-1', 'worker-5', 'pa-3', 'pap-6');

INSERT INTO access_logs (id, entry_timestamp, entry_signature_envelope, company_name_snapshot, first_name_snapshot, middle_name_snapshot, last_name_snapshot, second_last_name_snapshot, legal_id_snapshot, with_vehicle, visit_reason, site_id, created_by_id) VALUES
('log-3', '${isoDate(now, "07:00:00.000")}', '{"v":1,"alg":"aes-256-gcm","iv":"test","tag":"test","ct":"test"}', 'Grupo Electrica Levante SA', 'Francisco', 'Javier', 'Martinez', 'Lopez', '11223344C', 0, 'Trabajos de soldadura', 'site-1', 'user-2');

INSERT INTO access_logs (id, entry_timestamp, entry_signature_envelope, company_name_snapshot, first_name_snapshot, middle_name_snapshot, last_name_snapshot, second_last_name_snapshot, legal_id_snapshot, with_vehicle, visit_reason, site_id, created_by_id, planned_access_id, planned_access_person_id) VALUES
('log-4', '${isoDate(now, "08:15:00.000")}', '{"v":1,"alg":"aes-256-gcm","iv":"test","tag":"test","ct":"test"}', 'Construcciones Murcianas SL', 'Maria', NULL, 'Rodriguez', 'Perez', '87654321B', 0, 'Visita programada', 'site-1', 'user-2', 'pa-1', 'pap-2');
`;

  process.stdout.write(
    sql.replaceAll("INSERT INTO", "INSERT OR IGNORE INTO").trim() + "\n",
  );
}

main();
