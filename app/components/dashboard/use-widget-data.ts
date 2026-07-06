import { useEffect, useRef } from "react";
import { useFetcher } from "react-router";
import type { DashboardScope } from "~/lib/services/dashboard.server";

type UseWidgetDataResult<T> = {
  data: T | undefined;
  isLoading: boolean;
  revalidate: () => void;
};

export function useWidgetData<T = unknown>(
  route: string,
  scope: DashboardScope,
  refreshMs: number,
): UseWidgetDataResult<T> {
  const fetcher = useFetcher<T>();
  const routeRef = useRef(route);
  routeRef.current = route;

  const load = () => {
    const url = `${routeRef.current}?scope=${scope}`;
    fetcher.load(url);
  };

  useEffect(() => {
    load();
    if (refreshMs <= 0) return;
    const intervalId = window.setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        fetcher.state === "idle"
      ) {
        load();
      }
    }, refreshMs);
    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, refreshMs]);

  return {
    data: fetcher.data as T | undefined,
    isLoading: fetcher.state !== "idle",
    revalidate: load,
  };
}
