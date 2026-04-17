import { Button } from "~/components/ui/button";
import DataTable from "~/components/ui/data-table";

export async function loader() {
  const users = await getSites();

  return { users };
}

export default function Index() {
  return (
    <div className="grid space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Centros</h2>

        <Button>Nuevo centro</Button>
      </div>
      <DataTable columns={userColumns} data={loaderData.users ?? []} />
    </div>
  );
}
