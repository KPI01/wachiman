import { NavLink } from "react-router";
import { Separator } from "./ui/separator";

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
  return (
    <div className="flex items-center gap-3 min-w-0">
      {!href ? (
        <div className="flex w-32 shrink-0 items-center justify-center">
          <img
            src={process.env.APP_LOGO}
            alt={`Logo de ${process.env.APP_NAME}`}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      ) : (
        <NavLink
          to={href}
          className="flex w-32 shrink-0 items-center justify-center"
        >
          <img
            src={process.env.APP_LOGO}
            alt={`Logo de ${process.env.APP_NAME}`}
            className="max-h-full max-w-full object-contain"
          />
        </NavLink>
      )}
      <Separator orientation="vertical" className="shrink-0 hidden md:flex" />

      <div className="hidden md:flex md:flex-col md:min-w-0">
        <h2 className="text-xl font-bold uppercase tracking-tight truncate">
          {title}
        </h2>
        <div className="text-foreground/50 truncate">
          <span>Usuario:</span> {username}
        </div>
      </div>
    </div>
  );
}
