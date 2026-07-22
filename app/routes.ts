import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  // Public
  layout("routes/layout.tsx", [
    index("routes/welcome.tsx"),
    route("login", "routes/login.tsx"),
    route("unauthorized", "routes/unauthorized.tsx"),
  ]),

  // Autenticacion
  ...prefix("auth", [
    route("logout", "routes/auth/logout.tsx"),
    route("reset-password/:userId", "routes/auth/reset-password.tsx"),
  ]),

  // Protegidas genericas
  route("access-log/:id", "routes/access-log.tsx"),

  // Admin
  route("admin", "routes/admin/layout.tsx", [
    index("routes/admin/home.tsx"),
    route("users", "routes/admin/users.tsx"),
    route("sites", "routes/admin/sites.tsx"),
    route("departments", "routes/admin/departments.tsx"),
    route("access-logs", "routes/admin/access-logs.tsx"),
     route("planned-access", "routes/admin/planned-access.tsx"),
     route("planned-access/:id/approve", "routes/admin/planned-access.$id.approve.tsx"),
    route("external-workers", "routes/admin/external-workers.tsx"),
    route("external-worker/:id", "routes/admin/external-worker.$id.tsx"),
    route("companies", "routes/admin/companies.tsx"),
    route("work-categories", "routes/admin/work-categories.tsx"),
    route("audit-log", "routes/admin/audit-log.tsx"),
    route("documents", "routes/admin/documents.tsx"),
  ]),

  // Operador de accesos
  route("operator", "routes/operator/layout.tsx", [
    index("routes/operator/home.tsx"),
  ]),

  // Monitor de accesos
  route("monitor", "routes/monitor/layout.tsx", [
    index("routes/monitor/home.tsx"),
  ]),

  // Director de seguridad
  route("security", "routes/security/layout.tsx", [
    index("routes/security/home.tsx"),
    route("access-logs", "routes/security/access-logs.tsx"),
     route("planned-access", "routes/security/planned-access.tsx"),
     route("planned-access/:id/approve", "routes/security/planned-access.$id.approve.tsx"),
    route("external-workers", "routes/security/external-workers.tsx"),
    route("external-worker/:id", "routes/security/external-worker.$id.tsx"),
    route("companies", "routes/security/companies.tsx"),
    route("work-categories", "routes/security/work-categories.tsx"),
    route("audit-log", "routes/security/audit-log.tsx"),
    route("documents", "routes/security/documents.tsx"),
  ]),

  // Solicitante de accesos
  route("requester", "routes/requester/layout.tsx", [
    index("routes/requester/home.tsx"),
    route("planned-access", "routes/requester/planned-access.tsx"),
  ]),

  // Aprobador de accesos
  route("approver", "routes/approver/layout.tsx", [
    index("routes/approver/home.tsx"),
     route("planned-access", "routes/approver/planned-access.tsx"),
     route("planned-access/:id/approve", "routes/approver/planned-access.$id.approve.tsx"),
    route("access-logs", "routes/approver/access-logs.tsx"),
    route("external-workers", "routes/approver/external-workers.tsx"),
    route("external-worker/:id", "routes/approver/external-worker.$id.tsx"),
    route("companies", "routes/approver/companies.tsx"),
    route("work-categories", "routes/approver/work-categories.tsx"),
    route("documents", "routes/approver/documents.tsx"),
  ]),

  // API - Dashboard widgets (resource routes)
  ...prefix("api/dashboard", [
    route("people-inside", "routes/api/dashboard/people-inside.tsx"),
    route("today-access-count", "routes/api/dashboard/today-access-count.tsx"),
    route("planned-access-status", "routes/api/dashboard/planned-access-status.tsx"),
    route("last-access", "routes/api/dashboard/last-access.tsx"),
    route("requester-planned-status", "routes/api/dashboard/requester-planned-status.tsx"),
    route("requester-people-inside", "routes/api/dashboard/requester-people-inside.tsx"),
  ]),
  ...prefix("api/external-workers", [
    route("search", "routes/api/external-workers/search.tsx"),
    route(":id", "routes/api/external-workers/$id.tsx"),
    route(":workerId/documents", "routes/api/external-workers/$workerId.documents.tsx"),
    route(":workerId/documents/:docId", "routes/api/external-workers/$workerId.documents.$docId.tsx"),
    route(":workerId/documents/:docId/file", "routes/api/external-workers/$workerId.documents.$docId.file.tsx"),
  ]),
  route("api/worker-documents/check-expiry", "routes/api/worker-documents/check-expiry.tsx"),
] satisfies RouteConfig;
