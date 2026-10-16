import { CheckIcon } from "lucide-react";
import TableActionButton from "~/components/table-action-button";

type Props = {
  actionPath: string;
  plannedAccessId: string;
};

export default function ApprovePlannedAccessButton({
  actionPath,
  plannedAccessId,
}: Props) {
  return (
    <TableActionButton
      label="Revisar y aprobar acceso planificado"
      icon={CheckIcon}
      to={`${actionPath}/${plannedAccessId}/approve`}
    />
  );
}
