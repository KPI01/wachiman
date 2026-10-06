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
  const values = Object.fromEntries(
    Array.from(formData.entries()).filter(([, value]) => typeof value === "string"),
  );
  const logoFile = formData.get("appLogoFile");
  const faviconFile = formData.get("appFaviconFile");

  return updateGlobalAppSettings(values, user.username, {
    appLogoFile: logoFile instanceof File ? logoFile : null,
    appFaviconFile: faviconFile instanceof File ? faviconFile : null,
    resetAppLogo: formData.get("resetAppLogo") === "true",
    resetAppFavicon: formData.get("resetAppFavicon") === "true",
  });
}

export default function AdminSettings({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="max-w-3xl">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Configuración
        </h1>
        <p className="text-muted-foreground">
          Parámetros globales de funcionamiento de la aplicación.
        </p>
      </div>
      <AppSettingsForm settings={loaderData.settings} />
    </div>
  );
}
