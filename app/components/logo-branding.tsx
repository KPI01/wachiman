import { Separator } from "./ui/separator";

interface LogoBrandingProps {
  title: string;
  username?: string;
}
export default function LogoBranding({ title, username }: LogoBrandingProps) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="flex h-12 w-24 shrink-0 items-center justify-center">
        <img
          src="/logoFruveco.svg"
          alt="Logo de Fruveco"
          className="max-h-full max-w-full object-contain"
        />
      </div>
      <Separator orientation="vertical" className="shrink-0" />
      <div className="flex flex-col min-w-0">
        <h2 className="text-xl font-bold uppercase tracking-tight truncate">{title}</h2>
        <div className="text-foreground/50 truncate">
          <span>Usuario:</span> {username}
        </div>
      </div>
    </div>
  );
}
