import { data, Form, redirect } from "react-router";
import { validateUserRole } from "~/lib/auth.server";
import { PlannedAccessEntity } from "~/lib/database/planned-access.server";
import { WorkCategoryEntity } from "~/lib/database/work-category.server";
import {
  updatePlannedAccessStatus,
  // Comentado: la documentación ya no se gestiona desde este flujo.
  // uploadPlannedAccessPersonDocument,
} from "~/lib/services/planned-access.server";
// Comentado: la documentación ya no se revisa en el flujo de aprobación.
// import { reviewWorkerDocument } from "~/lib/services/worker-document.server";
import type { Route } from "./+types/planned-access.$id.approve";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { getSessionSite } from "~/lib/session.server";
import { ExternalWorkerEntity } from "~/lib/database/external-worker.server";
import { getManyAllowedAreas } from "~/lib/services/allowed-area.server";
import PlannedAccessApprovalPersonCard from "~/components/models/planned-access/planned-access-approval-person-card";
import { ItemGroup } from "~/components/ui/item";
// Comentado: la documentación ya no se gestiona desde este flujo.
// import { getDocumentByWorkerId } from "~/lib/services/worker-document.server";

export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await validateUserRole(request, [
    "ADMIN",
    "SECURITY_MANAGER",
    "ACCESS_APPROVER",
  ]);
  const sessionSite =
    user.role === "ACCESS_APPROVER" ? await getSessionSite(request) : null;
  const [plannedAccess, workCategories, allowedAreas] = await Promise.all([
    PlannedAccessEntity.findById(params.id),
    WorkCategoryEntity.findMany(),
    getManyAllowedAreas(),
  ]);

  if (!plannedAccess) throw data("Solicitud no encontrada", { status: 404 });
  if (sessionSite && plannedAccess.siteId !== sessionSite.id) {
    throw data("No tienes permisos para esta solicitud", { status: 403 });
  }
  if (plannedAccess.status !== "PENDING_APPROVAL") {
    throw data("La solicitud ya no está pendiente de aprobación", {
      status: 409,
    });
  }

  const people = await Promise.all(
    plannedAccess.plannedAccessPersons.map(async (person) => {
      const matched = await ExternalWorkerEntity.findByLegalId(
        person.legalIdSnapshot,
      );
      const worker = matched
        ? await ExternalWorkerEntity.findById(matched.id)
        : null;
      return { person, worker };
    }),
  );
// Comentado: la documentación ya no se revisa en el flujo de aprobación.
  // const hasPendingDocuments = people.some(({ worker }) =>
  //   worker?.documents?.some((document) => document.status === "PENDING_REVIEW"),
  // );
  const listPath =
    user.role === "ADMIN"
      ? "/admin/planned-access"
      : user.role === "SECURITY_MANAGER"
        ? "/security/planned-access"
        : "/approver/planned-access";

  const workerPath = listPath.replace("/planned-access", "/external-worker");
  const approvePath = `${listPath}/${params.id}/approve`;
return {
    plannedAccess,
    workCategories,
    allowedAreas,
    people,
    // Comentado: la documentación ya no se revisa en el flujo de aprobación.
    // hasPendingDocuments,
    listPath,
    workerPath,
    approvePath,
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const user = await validateUserRole(request, [
    "ADMIN",
    "SECURITY_MANAGER",
    "ACCESS_APPROVER",
  ]);
  const sessionSite =
    user.role === "ACCESS_APPROVER" ? await getSessionSite(request) : null;
const formData = await request.formData();
  // Comentado: la documentación ya no se revisa ni se sube desde este flujo.
  // if (formData.get("intent") === "review-document") {
  //   const plannedAccess = await PlannedAccessEntity.findById(params.id);
  //   const documentId = String(formData.get("documentId") ?? "");
  //   const personId = String(formData.get("personId") ?? "");
  //   const person = plannedAccess?.plannedAccessPersons.find((item) => item.id === personId);

  //   if (!plannedAccess || !person) {
  //     return { errors: "La persona o la solicitud no fueron encontradas." };
  //   }
  //   if (plannedAccess.status !== "PENDING_APPROVAL") {
  //     return { errors: "La solicitud ya no está pendiente de aprobación." };
  //   }
  //   if (sessionSite && plannedAccess.siteId !== sessionSite.id) {
  //     return { errors: "No tienes permisos para esta solicitud." };
  //   }

  //   const worker = await ExternalWorkerEntity.findByLegalId(person.legalIdSnapshot);
  //   if (!worker) {
  //     return { errors: "No se encontró el trabajador asociado a la persona." };
  //   }

  //   const document = await getDocumentByWorkerId(documentId, worker.id);
  //   if (!document) {
  //     return { errors: "El documento no pertenece al trabajador de esta solicitud." };
  //   }

  //   const result = await reviewWorkerDocument(
  //     documentId,
  //     {
  //       decision: String(formData.get("reviewDecision") ?? ""),
  //       reviewReason: String(formData.get("reviewReason") ?? ""),
  //     },
  //     user.id,
  //   );
  //   return result.success ? { success: true } : { errors: result.errors };
  // }
  // if (formData.get("intent") === "upload-document") {
  //   const file = formData.get("file");
  //   const personId = String(formData.get("personId") ?? "");
  //   const data: Record<string, string> = {};
  //   for (const [key, value] of formData.entries()) {
  //     if (key !== "file" && typeof value === "string") data[key] = value;
  //   }
  //   if (!(file instanceof File)) {
  //     return { errors: "Selecciona un archivo para cargar." };
  //   }
  //   const result = await uploadPlannedAccessPersonDocument(
  //     params.id,
  //     personId,
  //     file,
  //     data,
  //     {
  //       authorUsername: user.username,
  //       canApprove: true,
  //       lockedSiteId: sessionSite?.id,
  //     },
  //   );
  //   return result.success ? { upload: result.document } : { errors: result.errors };
  // }
  const result = await updatePlannedAccessStatus(
    { ...Object.fromEntries(formData), id: params.id, status: "APPROVED" },
    {
      authorUsername: user.username,
      canApprove: true,
      lockedSiteId: sessionSite?.id,
    },
  );

  if (result.success) {
    return redirect(
      user.role === "ADMIN"
        ? "/admin/planned-access"
        : user.role === "SECURITY_MANAGER"
          ? "/security/planned-access"
          : "/approver/planned-access",
    );
  }
  return { errors: result.errors };
}

export default function ApprovePlannedAccess({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <div className="flex justify-between gap-2 basis-full">
          <h2 className="text-3xl font-bold">Aprobar solicitud</h2>
          <div className="flex gap-2">
<Button
              type="submit"
              form="documentation-form"
              // Comentado: la documentación ya no bloquea la aprobación.
              // disabled={loaderData.hasPendingDocuments}
              // title={
              //   loaderData.hasPendingDocuments
              //     ? "Revisa los documentos pendientes antes de aprobar"
              //     : undefined
              // }
            >
              Confirmar aprobación
            </Button>

            <Button asChild variant="outline">
              <a href={loaderData.listPath}>Cancelar</a>
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">
          Selecciona un tipo de trabajo por persona.{" "}
          {/* Comentado: ya no se exige revisión documental. */}
          {/* La identificación vigente siempre es obligatoria. */}
          {/* Los documentos pendientes deben revisarse antes de confirmar. */}
        </p>
      </div>

      {actionData?.errors ? (
        <Alert variant="destructive">
          <AlertTitle>No se puede aprobar la solicitud</AlertTitle>
          <AlertDescription>{formatErrors(actionData.errors)}</AlertDescription>
        </Alert>
      ) : null}
      <Form id="documentation-form" method="post" className="hidden" />
      <ItemGroup>
          {loaderData.people.map(({ person, worker }) => (
            <PlannedAccessApprovalPersonCard
              key={person.id}
              person={person}
              worker={worker}
              workCategories={loaderData.workCategories}
              allowedAreas={loaderData.allowedAreas}
              validThrough={
                loaderData.plannedAccess.expectedEndDatetime ??
                loaderData.plannedAccess.expectedStartDatetime
              }
              actionPath={loaderData.approvePath}
              workerPath={loaderData.workerPath}
              formId="documentation-form"
            />
          ))}
      </ItemGroup>
    </div>
  );
}

function formatErrors(errors: unknown) {
  return typeof errors === "string"
    ? errors
    : "Revisa los datos de la solicitud.";
}
