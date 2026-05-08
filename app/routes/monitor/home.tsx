import type { Route } from "./+types/home";

export default function MonitorHome() {
  return (
    <div className="grid space-y-6">
      <h2 className="text-2xl font-bold">Monitor de Accesos</h2>
      <p className="text-muted-foreground">
        Este dashboard está reservado para el monitoreo de accesos.
      </p>
    </div>
  );
}