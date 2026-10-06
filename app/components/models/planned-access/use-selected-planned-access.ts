import { useCallback, useEffect, useState } from "react";
import type { PlannedAccessListItem } from "~/lib/database/planned-access.server";

export function useSelectedPlannedAccess(
  data: PlannedAccessListItem[] | PromiseLike<PlannedAccessListItem[]>,
) {
  const [selectedAccess, setSelectedAccess] =
    useState<PlannedAccessListItem | null>(null);

  const reconcileSelection = useCallback((rows: PlannedAccessListItem[]) => {
    setSelectedAccess((selected) => {
      if (!selected) return null;
      return rows.find((row) => row.id === selected.id) ?? selected;
    });
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve(data).then(
      (rows) => {
        if (active) reconcileSelection(rows);
      },
      () => undefined,
    );

    return () => {
      active = false;
    };
  }, [data, reconcileSelection]);

  return {
    selectedAccess,
    setSelectedAccess,
    reconcileSelection,
  };
}
