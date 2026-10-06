import { validateUserRole } from "~/lib/auth.server";
import { getAllDocuments } from "~/lib/services/worker-document.server";
// Comentado: la ruta /documents ya no está registrada, por lo que typegen no
// genera los tipos de ruta. Se definen tipos locales autocontenidos.
// import type { Route } from "./+types/documents";
import type { LoaderFunctionArgs } from "react-router";
import DataTable from "~/components/ui/data-table";
import { workerDocumentColumns } from "~/lib/columns/worker-document";

const GLOBAL_FILTER_COLUMNS = [
  "externalWorker.lastName",
  "externalWorker.legalId",
  "externalWorker.company.name",
  "fileName",
  "notes",
];

type LoaderArgs = LoaderFunctionArgs;

export async function loader({ request }: LoaderArgs) {
  await validateUserRole(request, ["ADMIN", "SECURITY_MANAGER", "ACCESS_APPROVER"]);
  const documents = await getAllDocuments();
  return { documents };
}

type ComponentProps = { loaderData: Awaited<ReturnType<typeof loader>> };

export default function DocumentsPage({ loaderData }: ComponentProps) {
  return (
    <div className="flex flex-col gap-y-4">
      <h2 className="text-3xl font-bold">Documentacion</h2>
      <DataTable
        columns={workerDocumentColumns()}
        data={loaderData.documents ?? []}
        refreshDataKey="documents"
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
