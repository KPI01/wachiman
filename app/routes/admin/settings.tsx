import { validateUserRole } from "~/lib/auth.server";
import { getGlobalAppSettings, updateGlobalAppSettings } from "~/lib/services/app-settings.server";
import AppSettingsForm from "~/components/models/settings/app-settings-form";
import type { Route } from "./+types/settings";

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, "ADMIN");
  const settings = await getGlobalAppSettings();
  if (!settings) throw new Response("La configuración global no está inicializada.", { status: 500 });
  return { settings };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await validateUserRole(request, "ADMIN");
  const formData = await request.formData();
  return updateGlobalAppSettings(Object.fromEntries(formData), user.username);
}

export default function AdminSettings({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-3xl font-bold">Configuración</h2>
        <p className="text-muted-foreground">
          Parámetros globales de funcionamiento de la aplicación.
        </p>
      </div>
      <AppSettingsForm settings={loaderData.settings} />
    </div>
  );
}
