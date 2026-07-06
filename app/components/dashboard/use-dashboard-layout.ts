import { useCallback, useEffect, useState } from "react";
import type { WidgetConstraints, WidgetLayout } from "./types";

type StoredLayout = WidgetLayout[];

const LAYOUT_VERSION = 1;

function storageKey(key: string) {
  return `wachiman.dashboard.${key}.layout.v${LAYOUT_VERSION}`;
}

function clampLayout(
  layout: WidgetLayout,
  constraints: WidgetConstraints,
): WidgetLayout {
  return {
    ...layout,
    w: clamp(layout.w, constraints.minW, constraints.maxW),
    h: clamp(layout.h, constraints.minH, constraints.maxH),
  };
}

function clamp(value: number, min?: number, max?: number) {
  let result = value;
  if (min !== undefined && result < min) result = min;
  if (max !== undefined && result > max) result = max;
  return result;
}

type LayoutResolverResult = {
  layout: WidgetLayout[];
  reset: () => void;
  persist: (next: WidgetLayout[]) => void;
};

export function useDashboardLayout(
  key: string,
  defaults: WidgetLayout[],
  constraintsByWidget: Record<string, WidgetConstraints>,
): LayoutResolverResult {
  const resolvedKey = storageKey(key);
  const [layout, setLayout] = useState<WidgetLayout[]>(defaults);

  const mergeWithDefaults = useCallback(
    (stored: StoredLayout | null): WidgetLayout[] => {
      if (!stored) return defaults;
      const storedById = new Map(stored.map((item) => [item.i, item]));
      return defaults.map((def) => {
        const storedItem = storedById.get(def.i);
        if (!storedItem) return def;
        const constraints = constraintsByWidget[def.i] ?? {};
        return clampLayout(
          {
            i: def.i,
            x: Number.isFinite(storedItem.x) ? storedItem.x : def.x,
            y: Number.isFinite(storedItem.y) ? storedItem.y : def.y,
            w: storedItem.w,
            h: storedItem.h,
          },
          constraints,
        );
      });
    },
    [defaults, constraintsByWidget],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(resolvedKey);
      const parsed: StoredLayout | null = raw ? JSON.parse(raw) : null;
      setLayout(mergeWithDefaults(parsed));
    } catch {
      setLayout(defaults);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedKey]);

  const persist = useCallback(
    (next: WidgetLayout[]) => {
      setLayout(next);
      if (typeof window === "undefined") return;
      try {
        window.localStorage.setItem(resolvedKey, JSON.stringify(next));
      } catch {
        // ignore quota / serialization errors
      }
    },
    [resolvedKey],
  );

  const reset = useCallback(() => {
    setLayout(defaults);
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(resolvedKey);
    } catch {
      // ignore
    }
  }, [resolvedKey, defaults]);

  return { layout, reset, persist };
}
