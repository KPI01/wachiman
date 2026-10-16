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
  canChangeSite = false,
  inline = false,
  onCancel,
  onSuccess,
}: {
  plannedAccess: PlannedAccessListItem;
  sites: Array<{ id: string; name: string }>;
  workCategories: Array<Pick<WorkCategory, "id" | "name">>;
  allowedAreas: Array<Pick<AllowedArea, "id" | "name" | "siteId">>;
  actionPath: string;
  canChangeSite?: boolean;
  inline?: boolean;
  onCancel?: () => void;
  onSuccess?: () => void;
}) {
  return (
    <PlannedAccessForm
      sites={sites}
      workCategories={workCategories}
      allowedAreas={allowedAreas}
      actionPath={actionPath}
      lockedSiteId={canChangeSite ? undefined : plannedAccess.siteId}
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
      buttonAriaLabel="Editar acceso planificado"
      buttonTooltip="Editar acceso planificado"
      title={
        <span className="text-2xl font-semibold">
          Editar acceso planificado
        </span>
      }
      description="Actualiza la información mientras el acceso planificado siga pendiente de aprobación."
      submitLabel="Guardar cambios"
      successMessage="Acceso planificado actualizado"
      inline={inline}
      onInlineCancel={onCancel}
      onInlineSuccess={onSuccess}
    />
  );
}
