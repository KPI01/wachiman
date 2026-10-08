import { data, Link, redirect } from "react-router";
import { validateUserRole } from "~/lib/auth.server";
import { getSessionSite } from "~/lib/session.server";
import { getPlannedAccessApprovalData, validatePlannedAccessCompany } from "~/lib/services/planned-access.server";
import { reviewPlannedAccessPerson } from "~/lib/services/planned-access-review.server";
import type { Route } from "./+types/planned-access.$id.approve";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import ValidatePlannedAccessCompanyForm from "~/components/models/planned-access/validate-planned-access-company-form";
import PlannedAccessApprovalPersonCard from "~/components/models/planned-access/planned-access-approval-person-card";
import { formatTimestamp } from "~/lib/utils";

export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await validateUserRole(request, ["ADMIN", "SECURITY_MANAGER", "ACCESS_APPROVER"]);
  const sessionSite = user.role === "ACCESS_APPROVER" ? await getSessionSite(request) : null;
  if (user.role === "ACCESS_APPROVER" && !sessionSite) throw data("Selecciona un centro", { status: 403 });
  const { plannedAccess } = await getPlannedAccessApprovalData(params.id);
  if (!plannedAccess) throw data("Solicitud no encontrada", { status: 404 });
  if (sessionSite && plannedAccess.siteId !== sessionSite.id) throw data("No tienes permisos para esta solicitud", { status: 403 });
  const listPath = user.role === "ADMIN" ? "/admin/planned-access" : user.role === "SECURITY_MANAGER" ? "/security/planned-access" : "/approver/planned-access";
  return { plannedAccess, listPath, approvePath: `${listPath}/${params.id}/approve` };
}

export async function action({ request, params }: Route.ActionArgs) {
  const user = await validateUserRole(request, ["ADMIN", "SECURITY_MANAGER", "ACCESS_APPROVER"]);
  const sessionSite = user.role === "ACCESS_APPROVER" ? await getSessionSite(request) : null;
  if (user.role === "ACCESS_APPROVER" && !sessionSite) throw data("Selecciona un centro", { status: 403 });
  const formData = await request.formData();
  const input = { ...Object.fromEntries(formData), id: params.id };
  const options = { authorUsername: user.username, lockedSiteId: sessionSite?.id };
  if (formData.get("intent") === "validate-company") return validatePlannedAccessCompany(input, options);
  if (formData.get("intent") === "review-person") {
    const result = await reviewPlannedAccessPerson(input, options);
    if (result.success && (result.status === "APPROVED" || result.status === "REJECTED")) {
      const listPath = user.role === "ADMIN" ? "/admin/planned-access" : user.role === "SECURITY_MANAGER" ? "/security/planned-access" : "/approver/planned-access";
      return redirect(listPath);
    }
    return result;
  }
  return { success: false, errors: "Selecciona aprobar o rechazar para cada visitante." };
}

export default function ApprovePlannedAccess({ loaderData }: Route.ComponentProps) {
  const access = loaderData.plannedAccess;
  const pending = (access.status ?? "PENDING_APPROVAL") === "PENDING_APPROVAL";
  const decided = access.plannedAccessPersons.filter((person) => person.decision && person.decision.accessDecision !== "PENDING").length;
  const info = [
    ["Centro", access.site?.name ?? "—"],
    ["Empresa", access.companySnapshot],
    ["Solicitado por", access.requestedBy?.fullName ?? "—"],
    ["Fecha de creación", formatTimestamp({ date: access.createdAt, template: "dd/MM/yyyy HH:mm" })],
    ["Inicio previsto", formatTimestamp({ date: access.expectedStartDatetime, template: "dd/MM/yyyy HH:mm" })],
    ["Fin previsto", access.expectedEndDatetime ? formatTimestamp({ date: access.expectedEndDatetime, template: "dd/MM/yyyy HH:mm" }) : "Sin fecha de fin"],
  ];
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-3xl font-bold">Revisar solicitud</h2>
        <Button asChild variant="outline"><Link to={loaderData.listPath}>Volver a solicitudes</Link></Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Datos de la solicitud</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-5">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {info.map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd>{value}</dd></div>)}
            <div className="sm:col-span-2 lg:col-span-3"><dt className="text-muted-foreground">Motivo de la visita</dt><dd className="whitespace-pre-wrap wrap-break-word">{access.visitReason}</dd></div>
          </dl>
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold">Visitantes indicados</h3>
            {access.plannedAccessPersons.map((person) => <dl key={person.id} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div><dt className="text-muted-foreground">Nombre y apellidos</dt><dd>{[person.firstNameSnapshot, person.middleNameSnapshot, person.lastNameSnapshot, person.secondLastNameSnapshot].filter(Boolean).join(" ")}</dd></div>
              <div><dt className="text-muted-foreground">DNI</dt><dd>{person.legalIdSnapshot}</dd></div>
              <div><dt className="text-muted-foreground">Teléfono</dt><dd>{person.phoneNumber || "—"}</dd></div>
              <div><dt className="text-muted-foreground">Área autorizada</dt><dd>{person.allowedAreaSnapshot}</dd></div>
              <div><dt className="text-muted-foreground">Tipo de trabajo</dt><dd>{person.workCategory?.name ?? "Sin tipo de trabajo indicado"}</dd></div>
            </dl>)}
          </div>
        </CardContent>
      </Card>
      {!access.companyId && pending ? <ValidatePlannedAccessCompanyForm
        key={new Date(access.updatedAt).toISOString()} companyName={access.companySnapshot}
        updatedAt={access.updatedAt} actionPath={loaderData.approvePath} /> : null}
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-xl font-semibold">Decisión por visitante</h3>
        <Badge variant="secondary">{decided} de {access.plannedAccessPersons.length} revisados</Badge>
        {!pending ? <Badge variant={access.status === "REJECTED" ? "destructive" : "default"}>
          {access.status === "REJECTED" ? "Solicitud rechazada" : "Revisión finalizada"}
        </Badge> : null}
      </div>
      {access.plannedAccessPersons.map((person) => <PlannedAccessApprovalPersonCard
        key={person.id} person={person} updatedAt={access.updatedAt} actionPath={loaderData.approvePath}
        companyValidated={Boolean(access.companyId)} pending={pending} />)}
    </div>
  );
}
