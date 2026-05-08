import type { UserRole } from "../../../prisma/generated/prisma/enums";

export const USER_ROLES: Record<UserRole, string> = {
  ADMIN: "Administrador",
  ACCESS_MONITOR: "Monitor de accesos",
  ACCESS_OPERATOR: "Operador de accesos",
  SECURITY_MANAGER: "Director de seguridad",
};
