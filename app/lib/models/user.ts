import { type UserRole } from "../../../db/enums";

export const USER_ROLES: Record<UserRole, string> = {
  ADMIN: "Administrador",
  ACCESS_MONITOR: "Mostrador",
  ACCESS_OPERATOR: "Portero",
  SECURITY_MANAGER: "Director de seguridad",
  ACCESS_REQUESTER: "Usuario interno",
  ACCESS_APPROVER: "Recursos Humanos",
};
