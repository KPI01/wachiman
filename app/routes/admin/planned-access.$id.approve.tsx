import { data, Form, redirect } from "react-router";
import { validateUserRole } from "~/lib/auth.server";
import { PlannedAccessEntity } from "~/lib/database/planned-access.server";
import { WorkCategoryEntity } from "~/lib/database/work-category.server";
import { updatePlannedAccessStatus } from "~/lib/services/planned-access.server";
import type { Route } from "./+types/planned-access.$id.approve";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { getSessionSite } from "~/lib/session.server";
import { ExternalWorkerEntity } from "~/lib/database/external-worker.server";
import PlannedAccessApprovalPersonCard from "~/components/models/planned-access/planned-access-approval-person-card";

export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await validateUserRole(request, ["ADMIN", "SECURITY_MANAGER", "ACCESS_APPROVER"]);
  const sessionSite = user.role === "ACCESS_APPROVER" ? await getSessionSite(request) : null;
  const [plannedAccess, workCategories] = await Promise.all([
    PlannedAccessEntity.findById(params.id),
    WorkCategoryEntity.findMany(),
  ]);

  if (!plannedAccess) throw data("Solicitud no encontrada", { status: 404 });
  if (sessionSite && plannedAccess.siteId !== sessionSite.id) {
    throw data("No tienes permisos para esta solicitud", { status: 403 });
  }
  if (plannedAccess.status !== "PENDING_APPROVAL") {
    throw data("La solicitud ya no está pendiente de aprobación", { status: 409 });
  }

  const people = await Promise.all(
    plannedAccess.plannedAccessPersons.map(async (person) => {
      const matched = await ExternalWorkerEntity.findByLegalId(person.legalIdSnapshot);
      const worker = matched ? await ExternalWorkerEntity.findById(matched.id) : null;
      return { person, worker };
    }),
  );
  const listPath = user.role === "ADMIN"
    ? "/admin/planned-access"
    : user.role === "SECURITY_MANAGER"
      ? "/security/planned-access"
      : "/approver/planned-access";

  return { plannedAccess, workCategories, people, listPath };
}

export async function action({ request, params }: Route.ActionArgs) {
  const user = await validateUserRole(request, ["ADMIN", "SECURITY_MANAGER", "ACCESS_APPROVER"]);
  const sessionSite = user.role === "ACCESS_APPROVER" ? await getSessionSite(request) : null;
  const formData = await request.formData();
  const result = await updatePlannedAccessStatus(
    { ...Object.fromEntries(formData), id: params.id, status: "APPROVED" },
    { authorUsername: user.username, canApprove: true, lockedSiteId: sessionSite?.id },
  );

  if (result.success) {
    return redirect(user.role === "ADMIN" ? "/admin/planned-access" : user.role === "SECURITY_MANAGER" ? "/security/planned-access" : "/approver/planned-access");
  }
  return { errors: result.errors };
}

export default function ApprovePlannedAccess({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <div className="flex w-full max-w-4xl flex-col gap-6">
      <div>
        <h2 className="text-3xl font-bold">Aprobar solicitud</h2>
        <p className="text-muted-foreground">Selecciona una categoría por persona. La identificación vigente siempre es obligatoria.</p>
      </div>
      {actionData?.errors ? (
        <Alert variant="destructive">
          <AlertTitle>No se puede aprobar la solicitud</AlertTitle>
          <AlertDescription>{formatErrors(actionData.errors)}</AlertDescription>
        </Alert>
      ) : null}
      <Form method="post" encType="multipart/form-data" className="flex flex-col gap-4">
        {loaderData.people.map(({ person, worker }) => (
          <PlannedAccessApprovalPersonCard
            key={person.id}
            person={person}
            worker={worker}
            workCategories={loaderData.workCategories}
            validThrough={
              loaderData.plannedAccess.expectedEndDatetime ??
              loaderData.plannedAccess.expectedStartDatetime
            }
          />
        ))}
        <div className="flex justify-end gap-2">
          <Button asChild variant="outline"><a href={loaderData.listPath}>Cancelar</a></Button>
          <Button type="submit">Confirmar aprobación</Button>
        </div>
      </Form>
    </div>
  );
}

function formatErrors(errors: unknown) {
  return typeof errors === "string" ? errors : "Revisa los datos de la solicitud y la documentación requerida.";
}
