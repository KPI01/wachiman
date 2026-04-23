import { Badge } from "~/components/ui/badge";
import type { PlannedAccessStatus } from "../../../../prisma/generated/prisma/enums";
import {
  PLANNED_ACCESS_STATUS_LABELS,
  PLANNED_ACCESS_STATUS_COLORS,
} from "~/lib/models/planned-access";
interface PlannedAccessStatusBadgeProps {
  status: PlannedAccessStatus;
}

export default function PlannedAccessStatusBadge({
  status,
}: PlannedAccessStatusBadgeProps) {
  const currentColor = PLANNED_ACCESS_STATUS_COLORS[status];
  const className = `bg-${currentColor}-50 text-${currentColor}-700 dark:bg-${currentColor}-950 dark:text-${currentColor}-300`;
  return (
    <Badge className={className}>{PLANNED_ACCESS_STATUS_LABELS[status]}</Badge>
  );
}
