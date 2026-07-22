import { NavLink } from "react-router";
import { useAppConfig } from "~/lib/app-config";

interface LogoBrandingProps {
  title: string;
  username?: string;
  href?: string;
}
export default function LogoBranding({
  title,
  username,
  href,
}: LogoBrandingProps) {
  const { appName, appLogo } = useAppConfig();

  return (
    <div className="flex items-center gap-3 min-w-0">
      {!href ? (
        <div className="flex w-14 shrink-0 items-center justify-center">
          <img
            src={appLogo}
            alt={`Logo de ${appName}`}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      ) : (
        <NavLink
          to={href}
          className="flex w-14 shrink-0 items-center justify-center"
        >
          <img
            src={appLogo}
            alt={`Logo de ${appName}`}
            className="max-h-full max-w-full object-contain"
          />
        </NavLink>
      )}
    </div>
  );
}
