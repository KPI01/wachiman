import { validateUserRole } from "~/lib/auth.server";
import { getAllDocuments } from "~/lib/services/worker-document.server";
import type { Route } from "./+types/documents";
import DataTable from "~/components/ui/data-table";
import { workerDocumentColumns } from "~/lib/columns/worker-document";

const GLOBAL_FILTER_COLUMNS = [
  "externalWorker.lastName",
  "externalWorker.legalId",
  "externalWorker.company.name",
  "fileName",
  "notes",
];

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, ["ADMIN", "SECURITY_MANAGER", "ACCESS_APPROVER"]);
  const documents = await getAllDocuments();
  return { documents };
}

export default function DocumentsPage({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex flex-col gap-y-4">
      <h2 className="text-3xl font-bold">Documentacion</h2>
      <DataTable
        columns={workerDocumentColumns()}
        data={loaderData.documents ?? []}
        globalFilterColumns={GLOBAL_FILTER_COLUMNS}
        empty={{
          title: "No hay documentos",
          description: "Los documentos subidos a los trabajadores externos apareceran aqui.",
        }}
        filterPlaceholder="Buscar por trabajador, DNI, empresa o archivo..."
      />
    </div>
  );
}
