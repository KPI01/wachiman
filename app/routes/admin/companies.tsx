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
import { catalogRecentFilter } from "~/components/ui/table-filter-presets";
import { useState } from "react";
import CompanyDetailsForm from "~/components/models/company/company-details-form";

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, [
    "ADMIN",
    "SECURITY_MANAGER",
    "ACCESS_APPROVER",
  ]);

  const companies = getManyCompanies();

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
  const companies = loaderData.companies;
  type CompanyRow = Awaited<typeof companies>[number];
  const [selectedCompany, setSelectedCompany] = useState<CompanyRow | null>(null);

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex">
        <h2 className="text-3xl font-bold">Empresas</h2>
        <CreateCompanyForm errors={actionData?.errors} />
      </div>
      <DataTable
        columns={companyColumns}
        data={companies}
        refreshDataKey="companies"
        globalFilterColumns={["name", "slug", "cif", "email"]}
        quickFilters={catalogRecentFilter()}
        onRowClick={setSelectedCompany}
        getRowLabel={(company) => `Abrir ficha de la empresa ${company.name}`}
        onRowsRefresh={(rows) =>
          setSelectedCompany((current) =>
            current ? rows.find((company) => company.id === current.id) ?? current : null,
          )
        }
      />
      {selectedCompany ? (
        <CompanyDetailsForm
          company={selectedCompany}
          open
          onOpenChange={(open) => {
            if (!open) setSelectedCompany(null);
          }}
          showTrigger={false}
        />
      ) : null}
    </div>
  );
}
