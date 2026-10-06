import { useNavigation } from "react-router";

export default function NavigationPending() {
  const navigation = useNavigation();
  if (navigation.state === "idle") return null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-100 h-0.5 overflow-hidden bg-primary/15"
      role="status"
      aria-live="polite"
      aria-label={navigation.state === "submitting" ? "Guardando cambios" : "Cargando página"}
    >
      <span className="block h-full w-1/3 animate-[navigation-progress_1.2s_ease-in-out_infinite] rounded-full bg-primary" />
      <span className="sr-only">{navigation.state === "submitting" ? "Guardando cambios…" : "Cargando página…"}</span>
    </div>
  );
}
