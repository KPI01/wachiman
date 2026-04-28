import { InfoIcon } from "lucide-react";
import AlertDialogContainer, {
  AlertDialogCancel,
} from "~/components/containers/alert-dialog-container";
import PlannedAccessStatusBadge from "~/components/models/planned-accesses/status-badge";
import type { PlannedAccessRow } from "~/lib/columns/planned-access";
import { formatTimestamp } from "~/lib/utils";

type RequesterPlannedAccessDetailsProps = {
  plannedAccess: PlannedAccessRow;
};

export default function RequesterPlannedAccessDetails({
  plannedAccess,
}: RequesterPlannedAccessDetailsProps) {
  return (
    <AlertDialogContainer
      buttonLabel={<InfoIcon />}
      buttonVariant="secondary"
      title="Detalle de la solicitud"
      description="Consulta el estado y los datos enviados para esta solicitud."
      contentClassName="max-h-[90vh] overflow-y-auto"
      footer={<AlertDialogCancel>Cerrar</AlertDialogCancel>}
    >
      <div className="space-y-6 text-sm">
        <section className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Inicio previsto</p>
            <p className="font-medium">
              {formatTimestamp({
                date: plannedAccess.expectedStartDate,
                template: "dd/MM/yyyy HH:mm",
              })}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Fin previsto</p>
            <p className="font-medium">
              {plannedAccess.expectedEndDate
                ? formatTimestamp({
                    date: plannedAccess.expectedEndDate,
                    template: "dd/MM/yyyy HH:mm",
                  })
                : "-"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Estado</p>
            <PlannedAccessStatusBadge status={plannedAccess.status} />
          </div>
          <div>
            <p className="text-muted-foreground">Creada</p>
            <p className="font-medium">
              {formatTimestamp({
                date: plannedAccess.createdAt,
                template: "dd/MM/yyyy HH:mm",
              })}
            </p>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="font-semibold">Personas</h3>
          {plannedAccess.plannedAccessPersons?.length ? (
            <ul className="space-y-2">
              {plannedAccess.plannedAccessPersons.map((person) => (
                <li key={person.id} className="rounded-lg border p-3">
                  <p className="font-medium">
                    {person.firstNameSnapshot} {person.middleNameSnapshot} {" "}
                    {person.lastNameSnapshot} {person.secondLastNameSnapshot}
                  </p>
                  <p className="text-muted-foreground">
                    DNI/NIE: {person.legalIdSnapshot}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">Sin personas registradas.</p>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="font-semibold">Vehiculos</h3>
          {plannedAccess.plannedAccessVehicles?.length ? (
            <ul className="space-y-2">
              {plannedAccess.plannedAccessVehicles.map((vehicle) => (
                <li key={vehicle.id} className="rounded-lg border p-3">
                  <p className="font-medium">
                    {vehicle.typeSnapshot} {vehicle.brandSnapshot} {" "}
                    {vehicle.modelSnapshot}
                  </p>
                  <p className="text-muted-foreground">
                    Matricula: {vehicle.plateSnapshot}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">Sin vehiculos registrados.</p>
          )}
        </section>
      </div>
    </AlertDialogContainer>
  );
}
