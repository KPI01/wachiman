import { PencilIcon } from "lucide-react";
import type { AllowedArea, WorkCategory } from "../../../../db/schema";
import type { PlannedAccessListItem } from "~/lib/database/planned-access.server";
import PlannedAccessForm, {
  type PlannedAccessFormValues,
} from "./planned-access-form";

function getInitialValues(
  plannedAccess: PlannedAccessListItem,
): PlannedAccessFormValues {
  return {
    siteId: plannedAccess.siteId,
    companySnapshot: plannedAccess.companySnapshot,
    companyId: plannedAccess.companyId ?? "",
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
      workCategoryId: person.workCategoryId ?? "",
      allowedAreaSnapshot: person.allowedAreaSnapshot ?? person.allowedArea?.name ?? "",
      allowedAreaId: person.allowedAreaId ?? "",
    })),
  };
}

export default function EditPlannedAccessForm({
  plannedAccess,
  sites,
  workCategories,
  allowedAreas,
  actionPath,
}: {
  plannedAccess: PlannedAccessListItem;
  sites: Array<{ id: string; name: string }>;
  workCategories: Array<Pick<WorkCategory, "id" | "name">>;
  allowedAreas: Array<Pick<AllowedArea, "id" | "name">>;
  actionPath: string;
}) {
  return (
    <PlannedAccessForm
      sites={sites}
      workCategories={workCategories}
      allowedAreas={allowedAreas}
      actionPath={actionPath}
      lockedSiteId={plannedAccess.siteId}
      initialValues={getInitialValues(plannedAccess)}
      hiddenFields={{
        intent: "edit",
        id: plannedAccess.id,
        expectedUpdatedAt: plannedAccess.updatedAt.toISOString(),
      }}
      formId={`edit-planned-access-${plannedAccess.id}`}
      buttonLabel={<PencilIcon aria-hidden="true" />}
      buttonVariant="ghost"
      buttonSize="icon-sm"
      buttonAriaLabel="Editar solicitud de acceso"
      buttonTooltip="Editar solicitud de acceso"
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
