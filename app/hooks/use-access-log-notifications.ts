import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { AccessLogListItem } from "~/lib/database/access-log.server";

function buildFullName(log: AccessLogListItem): string {
  return [
    log.firstNameSnapshot,
    log.middleNameSnapshot,
    log.lastNameSnapshot,
    log.secondLastNameSnapshot,
  ]
    .filter(Boolean)
    .join(" ");
}

function sendSystemNotification(title: string, body: string) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

export function useAccessLogNotifications(accessLogs: AccessLogListItem[]) {
  const prevIdsRef = useRef<Set<string>>(new Set());
  const isInitialRender = useRef(true);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      toast("¿Activar notificaciones de escritorio?", {
        description:
          "Recibe alertas incluso con la pestaña en segundo plano.",
        action: {
          label: "Activar",
          onClick: () => Notification.requestPermission(),
        },
        duration: 15000,
      });
    }
  }, []);

  useEffect(() => {
    if (accessLogs.length === 0) {
      return;
    }

    const currentIds = new Set(accessLogs.map((log) => log.id));

    if (isInitialRender.current) {
      isInitialRender.current = false;
      prevIdsRef.current = currentIds;
      return;
    }

    const intersection = [...currentIds].filter((id) =>
      prevIdsRef.current.has(id),
    );

    if (intersection.length === 0 && prevIdsRef.current.size > 0) {
      prevIdsRef.current = currentIds;
      return;
    }

    const newIds = [...currentIds].filter(
      (id) => !prevIdsRef.current.has(id),
    );

    for (const id of newIds) {
      const log = accessLogs.find((l) => l.id === id);
      if (!log) continue;

      const fullName = buildFullName(log);
      const body = `${fullName} · ${log.companyNameSnapshot} · ${log.site.name}`;

      toast.message("Nuevo acceso registrado", {
        description: body,
      });

      sendSystemNotification("Nuevo acceso registrado", body);
    }

    prevIdsRef.current = currentIds;
  }, [accessLogs]);
}
