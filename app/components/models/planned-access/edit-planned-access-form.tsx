import { PencilIcon } from "lucide-react";
import type { PlannedAccessListItem } from "~/lib/database/planned-access.server";
import PlannedAccessForm, {
  type PlannedAccessFormValues,
} from "./planned-access-form";
import TableActionButton from "~/components/table-action-button";

function getInitialValues(
  plannedAccess: PlannedAccessListItem,
): PlannedAccessFormValues {
  return {
    siteId: plannedAccess.siteId,
    companySnapshot: plannedAccess.companySnapshot,
    visitReason: plannedAccess.visitReason,
    expectedStartDatetime: plannedAccess.expectedStartDatetime,
    expectedEndDatetime: plannedAccess.expectedEndDatetime,
    visitors: plannedAccess.plannedAccessPersons.map((person) => ({
      id: person.id,
      legalIdSnapshot: person.legalIdSnapshot,
      firstNameSnapshot: person.firstNameSnapshot,
      middleNameSnapshot: person.middleNameSnapshot ?? "",
      lastNameSnapshot: person.lastNameSnapshot,
      secondLastNameSnapshot: person.secondLastNameSnapshot ?? "",
      phoneNumber: person.phoneNumber ?? "",
      externalWorkerId: person.externalWorkerId ?? "",
    })),
  };
}

export default function EditPlannedAccessForm({
  plannedAccess,
  sites,
  actionPath,
}: {
  plannedAccess: PlannedAccessListItem;
  sites: Array<{ id: string; name: string }>;
  actionPath: string;
}) {
  return (
    <PlannedAccessForm
      sites={sites}
      actionPath={actionPath}
      lockedSiteId={plannedAccess.siteId}
      initialValues={getInitialValues(plannedAccess)}
      hiddenFields={{
        intent: "edit",
        id: plannedAccess.id,
        expectedUpdatedAt: plannedAccess.updatedAt.toISOString(),
      }}
      formId={`edit-planned-access-${plannedAccess.id}`}
      buttonLabel={
        <TableActionButton
          label="Editar solicitud de acceso"
          icon={PencilIcon}
          variant="ghost"
        />
      }
      triggerAsChild
      title={
        <span className="text-2xl font-semibold">
          Editar Solicitud de Acceso
        </span>
      }
      description="Actualiza la información mientras la solicitud siga pendiente de aprobación."
      submitLabel="Guardar cambios"
      successMessage="Solicitud de acceso actualizada"
    />
  );
}
