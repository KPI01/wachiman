import type { Route } from "./+types/holder-company";
import HolderCompanyForm from "~/components/models/settings/holder-company-form";
import { validateUserRole } from "~/lib/auth.server";
import {
  getGlobalAppSettings,
  updateHolderCompanySettings,
} from "~/lib/services/app-settings.server";

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, "ADMIN");
  const settings = await getGlobalAppSettings();
  if (!settings) throw new Response("Los datos de la empresa titular no están inicializados.", { status: 500 });
  return { settings };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await validateUserRole(request, "ADMIN");
  const formData = await request.formData();
  return updateHolderCompanySettings(Object.fromEntries(formData), user.username);
}

export default function AdminHolderCompany({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="max-w-3xl">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Empresa titular
        </h1>
        <p className="text-muted-foreground">
          Información legal utilizada en los documentos y registros oficiales de acceso.
        </p>
      </div>
      <HolderCompanyForm settings={loaderData.settings} />
    </div>
  );
}
