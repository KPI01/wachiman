import { PlusIcon } from "lucide-react";
import PlannedAccessForm from "./planned-access-form";

export default function CreatePlannedAccessForm({
  sites,
  actionPath = "/admin/planned-access",
  lockedSiteId,
}: {
  sites: Array<{ id: string; name: string }>;
  actionPath?: string;
  lockedSiteId?: string;
}) {
  return (
    <PlannedAccessForm
      sites={sites}
      actionPath={actionPath}
      lockedSiteId={lockedSiteId}
      formId="create-planned-access"
      buttonLabel={
        <>
          <PlusIcon data-icon="inline-start" />
          Nueva solicitud
        </>
      }
      title={<span className="text-2xl font-semibold">Nueva Solicitud de Acceso</span>}
      description="Ingresa la informacion de la visita planificada. Los campos con (*) son obligatorios."
      submitLabel="Enviar"
      successMessage="Solicitud de acceso creada"
      resetOnSuccess
    />
  );
}
