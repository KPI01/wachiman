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
  ]),
] satisfies RouteConfig;
