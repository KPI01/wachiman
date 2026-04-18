import type { UserRole } from "../../../generated/prisma/enums";

export const USER_ROLES: Record<UserRole, string> = {
  ADMIN: "Administrador",
  ACCESS_APPROVER: "Validador de solicitudes",
  ACCESS_MONITOR: "Monitor de access",
  ACCESS_OPERATOR: "Operador de accesos",
  ACCESS_REQUESTER: "Solicitante de accesos",
  SECURITY_MANAGER: "Director de seguridad",
};
