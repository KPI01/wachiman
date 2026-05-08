import type { Route } from "./+types/home";

export default function SecurityHome() {
  return (
    <div className="grid space-y-6">
      <h2 className="text-2xl font-bold">Director de Seguridad</h2>
      <p className="text-muted-foreground">
        Este dashboard está reservado para la gestión de seguridad.
      </p>
    </div>
  );
}