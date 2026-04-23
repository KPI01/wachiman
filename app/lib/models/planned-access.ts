import { PlannedAccessStatus } from "../../../prisma/generated/prisma/enums";

export const PLANNED_ACCESS_STATUS_LABELS: Record<PlannedAccessStatus, string> = {
  PENDING_APPROVAL: "Pendiente de aprobación",
  PENDING_ACCESS: "Pendiente de acceso",
  IN_PROGRESS: "En progreso",
  COMPLETED: "Completado",
  REJECTED: "Rechazado",
  CANCELLED: "Cancelado",
  EXPIRED: "Expirado",
  RESCHEDULED: "Reprogramado",
};
