import DataTable from "~/components/ui/data-table";
import { companyColumns } from "~/lib/columns/company";
import { validateUserRole } from "~/lib/auth.server";
import {
  createCompany,
  deleteCompany,
  getManyCompanies,
  updateCompany,
} from "~/lib/services/company.server";
import type { Route } from "./+types/companies";
import CreateCompanyForm from "~/components/models/company/create-company-form";
import { Separator } from "~/components/ui/separator";

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, [
    "ADMIN",
    "SECURITY_MANAGER",
    "ACCESS_APPROVER",
  ]);

  const companies = await getManyCompanies();

  return { companies };
}

export async function action({ request }: Route.ActionArgs) {
  await validateUserRole(request, [
    "ADMIN",
    "SECURITY_MANAGER",
    "ACCESS_APPROVER",
  ]);

  const method = request.method.toUpperCase();
  const rawFormData = await request.formData();
  const jsonData = Object.fromEntries(rawFormData);

  if (method === "POST") {
    return await createCompany(jsonData);
  }

  if (method === "PUT" || method === "PATCH") {
    return await updateCompany(jsonData);
  }

  if (method === "DELETE") {
    return await deleteCompany(jsonData);
  }
}

export default function CompaniesIndex({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex">
        <h2 className="text-3xl font-bold">Empresas</h2>
        <CreateCompanyForm errors={actionData?.errors} />
      </div>
      <Separator />
      <DataTable
        columns={companyColumns}
        data={loaderData.companies ?? []}
        globalFilterColumns={["name", "slug", "cif", "email"]}
      />
    </div>
  );
}
