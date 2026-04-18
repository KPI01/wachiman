import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  // Public
  layout("routes/layout.tsx", [
    index("routes/welcome.tsx"),
    route("login", "routes/login.tsx"),
    route("unauthorized", "routes/unauthorized.tsx"),
  ]),

  // Protegidas genericas
  route("logout", "routes/logout.tsx"),

  // Admin
  route("admin", "routes/admin/layout.tsx", [
    index("routes/admin/home.tsx"),

    // Gestion de usuarios
    route("users", "routes/admin/users/index.tsx"),
    route("users/:userId", "routes/admin/users/detail.tsx"),

    // Gestion de centros
    route("sites", "routes/admin/sites/index.tsx"),
    route("sites/:siteId", "routes/admin/sites/detail.tsx"),
  ]),
] satisfies RouteConfig;
