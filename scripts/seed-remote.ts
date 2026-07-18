import "dotenv/config";
import { hashText } from "../app/lib/hash.server";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "demo123";
const ADMIN_FULL_NAME = process.env.ADMIN_FULL_NAME ?? "Administrador";
const SITE_NAME = process.env.SITE_NAME ?? "Sitio principal";
const SITE_SLUG = process.env.SITE_SLUG ?? "PRINCIPAL";
const DEPT_NAME = process.env.DEPARTMENT_NAME ?? "General";
const DEPT_SLUG = process.env.DEPARTMENT_SLUG ?? "GENERAL";

const hashedPassword = await hashText(ADMIN_PASSWORD);
const now = new Date().toISOString();

const sql = `
DELETE FROM users;
DELETE FROM departments;
DELETE FROM sites;

INSERT INTO sites (id, name, slug, created_at, updated_at)
VALUES ('site-1', '${SITE_NAME}', '${SITE_SLUG}', '${now}', '${now}');

INSERT INTO departments (id, name, slug, created_at, updated_at)
VALUES ('dept-1', '${DEPT_NAME}', '${DEPT_SLUG}', '${now}', '${now}');

INSERT INTO users (id, full_name, username, password, role, is_active, is_trashed, site_id, department_id, created_at, updated_at)
VALUES ('user-1', '${ADMIN_FULL_NAME}', '${ADMIN_USERNAME}', '${hashedPassword}', 'ADMIN', 1, 0, 'site-1', 'dept-1', '${now}', '${now}');
`;

process.stdout.write(sql.trim() + "\n");
