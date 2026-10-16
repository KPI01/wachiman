import { PlusIcon } from "lucide-react";
import PlannedAccessForm from "./planned-access-form";
import type { AllowedArea, WorkCategory } from "../../../../db/schema";

export default function CreatePlannedAccessForm({
  sites,
  workCategories,
  allowedAreas,
  actionPath = "/admin/planned-access",
  lockedSiteId,
}: {
  sites: Array<{ id: string; name: string }>;
  workCategories: Array<Pick<WorkCategory, "id" | "name">>;
  allowedAreas: Array<Pick<AllowedArea, "id" | "name" | "siteId">>;
  actionPath?: string;
  lockedSiteId?: string;
}) {
  return (
    <PlannedAccessForm
      sites={sites}
      workCategories={workCategories}
      allowedAreas={allowedAreas}
      actionPath={actionPath}
      lockedSiteId={lockedSiteId}
      formId="create-planned-access"
      buttonLabel={
        <>
          <PlusIcon data-icon="inline-start" />
          Nuevo acceso planificado
        </>
      }
      title={<span className="font-semibold">Nuevo acceso planificado</span>}
      description="Ingresa la informacion de la visita planificada. Los campos con (*) son obligatorios."
      submitLabel="Enviar"
      successMessage="Acceso planificado creado"
      resetOnSuccess
    />
  );
}
