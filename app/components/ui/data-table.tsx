"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type Header,
  type PaginationState,
  type Row,
  type SortingState,
  type Table as TanstackTable,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  Columns3Icon,
  ListFilterIcon,
  LoaderCircleIcon,
  RotateCcwIcon,
} from "lucide-react";
import { useFetcher, useLocation, useRevalidator, useSearchParams } from "react-router";

import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "./empty";
import { Input } from "./input";
import { Label } from "./label";
import { DateTimePicker } from "./date-time-picker";
import { Skeleton } from "./skeleton";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./popover";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";
import { cn } from "~/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

export type DataTableColumnHeaderActions<TData> = Partial<
  Record<
    string,
    React.ReactNode | ((column: Column<TData, any>) => React.ReactNode)
  >
>;

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[] | PromiseLike<TData[]>;
  globalFilterColumns?: readonly string[];
  columnHeaderActions?: DataTableColumnHeaderActions<TData>;
  filterPlaceholder?: string;
  showGlobalFilter?: boolean;
  showColumnVisibility?: boolean;
  stackQuickFilterGroups?: boolean;
  fitColumns?: boolean;
  columnLabels?: Partial<Record<string, string>>;
  empty?: Partial<{
    title: string;
    description: string;
  }>;
  quickFilters?: DataTableQuickFilterGroup<TData>[];
  advancedFilters?: DataTableAdvancedFilter[];
  serverFiltering?: boolean;
  refreshIntervalMs?: number;
  refreshDataKey?: string;
  transformRefreshedData?: (rows: unknown[]) => TData[];
  onRowsRefresh?: (rows: TData[]) => void;
  onRowClick?: (row: TData) => void;
  getRowLabel?: (row: TData) => string;
  stickyRightColumnIds?: string[];
  additionalFilterParams?: string[];
}

type LoadedDataTableProps<TData> = DataTableProps<TData>;

export type DataTableFilterOption<TData> = {
  value: string;
  label: string;
  matchValue?: unknown;
  predicate?: (row: TData) => boolean;
};

export type DataTableQuickFilterGroup<TData> = {
  param: string;
  label: string;
  columnId?: string;
  defaultValue?: string;
  allValue?: string;
  clearParamsOnChange?: string[];
  syncQueryParams?: (value: string, now: Date) => Record<string, string | null>;
  options: DataTableFilterOption<TData>[];
};

export type DataTableAdvancedFilter = {
  param: string;
  label: string;
  type: "text" | "select" | "date" | "date-range" | "date-time-range";
  columnId?: string;
  options?: Array<{ value: string; label: string }>;
  fromParam?: string;
  toParam?: string;
  quickFilterParams?: string[];
  scopeParam?: string;
  scopeLabel?: string;
  scopeDefaultValue?: string;
  scopeOptions?: Array<{ value: string; label: string }>;
  fieldParam?: string;
  fieldLabel?: string;
  fieldDefaultValue?: string;
  fieldOptions?: Array<{ value: string; label: string }>;
  fieldOptionsByScope?: Record<string, Array<{ value: string; label: string }>>;
};

export default function DataTable<TData>(props: DataTableProps<TData>) {
  return <LoadedDataTable {...props} />;
}

function LoadedDataTable<TData>({
  columns,
  data,
  globalFilterColumns,
  columnHeaderActions,
  filterPlaceholder,
  showGlobalFilter = true,
  showColumnVisibility = true,
  stackQuickFilterGroups = true,
  fitColumns = false,
  columnLabels,
  empty,
  quickFilters = [],
  advancedFilters = [],
  serverFiltering = false,
  refreshIntervalMs = 30_000,
  refreshDataKey,
  transformRefreshedData,
  onRowsRefresh,
  onRowClick,
  getRowLabel,
  stickyRightColumnIds = [],
  additionalFilterParams = [],
}: LoadedDataTableProps<TData>) {
  const fetcher = useFetcher<Record<string, unknown>>();
  const revalidator = useRevalidator();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [filterDraft, setFilterDraft] = React.useState<Record<string, string>>({});
  const [filterDraftVersion, setFilterDraftVersion] = React.useState(0);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const querySearch = searchParams.get("q") ?? "";
  const [globalFilter, setGlobalFilter] = React.useState(querySearch);
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const dataTableRootRef = React.useRef<HTMLDivElement>(null);
  const tableViewportRef = React.useRef<HTMLDivElement>(null);
  const paginationFooterRef = React.useRef<HTMLDivElement>(null);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [resolvedData, setResolvedData] = React.useState<TData[]>(() =>
    isPromiseLike(data) ? [] : data,
  );
  const [hasLoadedData, setHasLoadedData] = React.useState(() =>
    !isPromiseLike(data),
  );
  const [isDeferredDataLoading, setIsDeferredDataLoading] = React.useState(() =>
    isPromiseLike(data),
  );
  const [deferredDataError, setDeferredDataError] = React.useState(false);
  const deferredDataVersionRef = React.useRef(0);
  const resolvedDataRef = React.useRef(resolvedData);
  resolvedDataRef.current = resolvedData;
  const searchableColumnIds = React.useMemo(
    () => getSearchableColumnIds(columns, globalFilterColumns),
    [columns, globalFilterColumns],
  );
  const hasColumnHeaderActions = Object.keys(columnHeaderActions ?? {}).length > 0;
  const activeFilterCount = React.useMemo(
    () =>
      (querySearch ? 1 : 0) +
      columnFilters.length +
      additionalFilterParams.filter((param) => searchParams.has(param)).length +
      quickFilters.filter((filter) => {
        const value = searchParams.get(filter.param);
        const isRepresentedByAdvancedFilter = advancedFilters.some((advancedFilter) =>
          advancedFilter.quickFilterParams?.includes(filter.param) &&
          isDateRangeFilter(advancedFilter) &&
          (searchParams.has(advancedFilter.fromParam ?? `${advancedFilter.param}From`) ||
            searchParams.has(advancedFilter.toParam ?? `${advancedFilter.param}To`)),
        );
        return Boolean(value && value !== filter.allValue && !isRepresentedByAdvancedFilter);
      }).length +
      advancedFilters.filter((filter) =>
        isDateRangeFilter(filter)
          ? searchParams.has(filter.fromParam ?? `${filter.param}From`) ||
            searchParams.has(filter.toParam ?? `${filter.param}To`)
          : searchParams.has(filter.param),
      ).length,
    [additionalFilterParams, advancedFilters, columnFilters.length, querySearch, quickFilters, searchParams],
  );

  const tableHref = `${location.pathname}${location.search}`;
  const latestDataRef = React.useRef(resolvedData);
  latestDataRef.current = resolvedData;
  const fetcherRef = React.useRef(fetcher);
  fetcherRef.current = fetcher;
  const tableHrefRef = React.useRef(tableHref);
  tableHrefRef.current = tableHref;
  const pendingPollRef = React.useRef<{
    href: string;
    data: unknown;
    sourceData: TData[];
  } | null>(null);
  const pollTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPolling, setIsPolling] = React.useState(false);
  const [pollError, setPollError] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    const requestVersion = ++deferredDataVersionRef.current;

    if (!isPromiseLike(data)) {
      resolvedDataRef.current = data;
      setResolvedData(data);
      setHasLoadedData(true);
      setIsDeferredDataLoading(false);
      setDeferredDataError(false);
      setPollError(false);
      return () => {
        active = false;
      };
    }

    setIsDeferredDataLoading(true);
    setDeferredDataError(false);
    Promise.resolve(data).then(
      (rows) => {
        if (!active || requestVersion !== deferredDataVersionRef.current) return;
        resolvedDataRef.current = rows;
        setResolvedData(rows);
        setHasLoadedData(true);
        setIsDeferredDataLoading(false);
        setPollError(false);
      },
      () => {
        if (!active || requestVersion !== deferredDataVersionRef.current) return;
        setIsDeferredDataLoading(false);
        setDeferredDataError(true);
      },
    );

    return () => {
      active = false;
    };
  }, [data]);

  useDataTablePolling(
    refreshIntervalMs,
    refreshDataKey,
    fetcherRef,
    tableHrefRef,
    latestDataRef,
    pendingPollRef,
    pollTimeoutRef,
    setIsPolling,
    setPollError,
  );

  React.useEffect(() => {
    const pending = pendingPollRef.current;
    if (!pending || fetcher.state !== "idle") return;

    const clearPendingPoll = () => {
      pendingPollRef.current = null;
      setIsPolling(false);
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
    };

    // Keep the last successful rows when a poll failed or another loader
    // update completed while this request was in flight.
    if (fetcher.data === pending.data) {
      clearPendingPoll();
      setPollError(true);
      return;
    }

    const refreshedRows = refreshDataKey
      ? getValueAtPath(fetcher.data, refreshDataKey)
      : undefined;
    Promise.resolve(refreshedRows)
      .then((rows: unknown) => {
        if (pendingPollRef.current !== pending) return;
        clearPendingPoll();
        if (
          latestDataRef.current !== pending.sourceData ||
          tableHrefRef.current !== pending.href
        ) return;
        if (!Array.isArray(rows)) {
          setPollError(true);
          return;
        }

        const nextRows = transformRefreshedData
          ? transformRefreshedData(rows)
          : (rows as TData[]);
        if (areDataTableRowsEqual(latestDataRef.current, nextRows)) {
          setPollError(false);
          return;
        }
        // A successful, newer poll supersedes a slower initial/deferred loader.
        deferredDataVersionRef.current += 1;
        resolvedDataRef.current = nextRows;
        setResolvedData(nextRows);
        setHasLoadedData(true);
        setIsDeferredDataLoading(false);
        setDeferredDataError(false);
        onRowsRefresh?.(nextRows);
        setPollError(false);
      })
      .catch(() => {
        if (pendingPollRef.current !== pending) return;
        clearPendingPoll();
        setPollError(true);
      });
  }, [fetcher.data, fetcher.state, onRowsRefresh, pollTimeoutRef, refreshDataKey, setIsPolling, transformRefreshedData]);

  React.useEffect(() => {
    setGlobalFilter(querySearch);
  }, [querySearch]);

  React.useEffect(() => {
    setPagination((current) =>
      current.pageIndex === 0 ? current : { ...current, pageIndex: 0 },
    );
  }, [tableHref, globalFilter, columnFilters]);

  React.useEffect(() => {
    const updatePageSize = () => {
      const tableViewport = tableViewportRef.current;
      if (!tableViewport) return;

      const tableElement = tableViewport.querySelector("table");
      const headerRow = tableElement?.querySelector("thead tr");
      const bodyRow = tableElement?.querySelector("tbody tr");
      const paginationFooter = paginationFooterRef.current;
      const tableTop = tableViewport.getBoundingClientRect().top;
      const headerHeight = headerRow?.getBoundingClientRect().height ?? 40;
      const rowHeight = bodyRow?.getBoundingClientRect().height ?? 40;
      const footerHeight = paginationFooter?.getBoundingClientRect().height ?? 40;
      const spacingAndBottomPadding = 44;
      const availableHeight =
        window.innerHeight - tableTop - footerHeight - spacingAndBottomPadding;
      const nextPageSize = Math.max(
        1,
        Math.floor((availableHeight - headerHeight) / Math.max(rowHeight, 1)),
      );

      setPagination((current) =>
        current.pageSize === nextPageSize
          ? current
          : { ...current, pageIndex: 0, pageSize: nextPageSize },
      );
    };

    const animationFrame = window.requestAnimationFrame(updatePageSize);
    window.addEventListener("resize", updatePageSize);
    const resizeObserver = new ResizeObserver(updatePageSize);
    if (dataTableRootRef.current) resizeObserver.observe(dataTableRootRef.current);
    if (tableViewportRef.current) resizeObserver.observe(tableViewportRef.current);
    if (paginationFooterRef.current) resizeObserver.observe(paginationFooterRef.current);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", updatePageSize);
      resizeObserver.disconnect();
    };
  }, [resolvedData.length, hasLoadedData]);

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchParams((current) => {
        const value = globalFilter.trim();
        if ((current.get("q") ?? "") === value) return current;
        const next = new URLSearchParams(current);
        if (value) next.set("q", value);
        else next.delete("q");
        return next;
      }, { replace: true, preventScrollReset: true });
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [globalFilter, setSearchParams]);

  const visibleData = React.useMemo(
    () =>
      serverFiltering
        ? resolvedData
        : filterRowsLocally(resolvedData, quickFilters, advancedFilters, searchParams),
    [advancedFilters, quickFilters, searchParams, serverFiltering, resolvedData],
  );

  const table = useReactTable({
    data: visibleData,
    columns,
    getRowId: (row, index) => getStableDataTableRowId(row, index),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    autoResetPageIndex: false,
    globalFilterFn: (row, _columnId, filterValue) =>
      matchesGlobalFilter(row, searchableColumnIds, filterValue),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      columnVisibility,
      pagination,
    },
    onPaginationChange: setPagination,
  });

  React.useEffect(() => {
    const lastPageIndex = Math.max(
      0,
      Math.ceil(visibleData.length / pagination.pageSize) - 1,
    );
    if (pagination.pageIndex > lastPageIndex) {
      setPagination((current) => ({ ...current, pageIndex: lastPageIndex }));
    }
  }, [pagination.pageIndex, pagination.pageSize, visibleData.length]);

  const updateQueryParam = (param: string, value: string) => {
    const changedGroup = quickFilters.find((filter) => filter.param === param);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      for (const clearParam of changedGroup?.clearParamsOnChange ?? []) next.delete(clearParam);
      const queryValue = value === "all" ? changedGroup?.allValue ?? "" : value;
      if (queryValue) next.set(param, queryValue);
      else next.delete(param);
      for (const [syncParam, syncValue] of Object.entries(
        changedGroup?.syncQueryParams?.(value, new Date()) ?? {},
      )) {
        if (syncValue) next.set(syncParam, syncValue);
        else next.delete(syncParam);
      }
      return next;
    }, { replace: true, preventScrollReset: true });
    setFiltersOpen(false);
  };

  const applyAdvancedFilters = () => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      for (const filter of advancedFilters) {
        const hasValue = isDateRangeFilter(filter)
          ? Boolean(
              filterDraft[filter.fromParam ?? `${filter.param}From`] ||
                filterDraft[filter.toParam ?? `${filter.param}To`],
            )
          : Boolean(filterDraft[filter.param]);

        if (filter.quickFilterParams?.length) {
          for (const quickParam of filter.quickFilterParams) {
            const linkedQuickFilter = quickFilters.find((quickFilter) => quickFilter.param === quickParam);
            const selectedValue = current.get(quickParam) ?? linkedQuickFilter?.defaultValue ?? "all";
            const synchronizedParams = linkedQuickFilter?.syncQueryParams?.(selectedValue, new Date()) ?? {};
            const draftMatchesQuickFilter = Object.keys(synchronizedParams).length > 0 &&
              Object.entries(synchronizedParams).every(([syncParam, syncValue]) =>
                (filterDraft[syncParam] || null) === syncValue,
              );
            if (!draftMatchesQuickFilter) next.delete(quickParam);
          }
        }

        if (!hasValue) {
          next.delete(filter.param);
          next.delete(filter.fromParam ?? `${filter.param}From`);
          next.delete(filter.toParam ?? `${filter.param}To`);
          if (filter.scopeParam) next.delete(filter.scopeParam);
          if (filter.fieldParam) next.delete(filter.fieldParam);
          continue;
        }

        if (isDateRangeFilter(filter)) {
          const fromParam = filter.fromParam ?? `${filter.param}From`;
          const toParam = filter.toParam ?? `${filter.param}To`;
          for (const param of [fromParam, toParam]) {
            if (filterDraft[param]) next.set(param, filterDraft[param]);
            else next.delete(param);
          }
        } else if (filterDraft[filter.param]) {
          next.set(filter.param, filterDraft[filter.param]);
        } else {
          next.delete(filter.param);
        }

        const scopeValue = filter.scopeParam
          ? filterDraft[filter.scopeParam] ?? filter.scopeDefaultValue
          : undefined;
        if (filter.scopeParam && scopeValue) {
          next.set(filter.scopeParam, scopeValue);
        }

        if (filter.fieldParam) {
          const availableFields = scopeValue
            ? filter.fieldOptionsByScope?.[scopeValue] ?? filter.fieldOptions
            : filter.fieldOptions;
          const fieldValue =
            filterDraft[filter.fieldParam] ??
            filter.fieldDefaultValue ??
            availableFields?.[0]?.value;
          if (fieldValue) next.set(filter.fieldParam, fieldValue);
          else next.delete(filter.fieldParam);
        }

      }
      return next;
    }, { replace: true, preventScrollReset: true });
    setFiltersOpen(false);
  };

  const resetFilters = () => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("q");
      for (const param of additionalFilterParams) next.delete(param);
      for (const filter of quickFilters) next.delete(filter.param);
      for (const filter of advancedFilters) {
        next.delete(filter.param);
        next.delete(filter.fromParam ?? `${filter.param}From`);
        next.delete(filter.toParam ?? `${filter.param}To`);
        if (filter.scopeParam) next.delete(filter.scopeParam);
        if (filter.fieldParam) next.delete(filter.fieldParam);
      }
      return next;
    }, { replace: true, preventScrollReset: true });
    setGlobalFilter("");
    setColumnFilters([]);
    setFilterDraft({});
    setFilterDraftVersion((version) => version + 1);
  };

  return (
    <div
      ref={dataTableRootRef}
      className="flex min-w-0 max-w-full flex-col gap-4 overflow-hidden"
      aria-busy={!hasLoadedData || isDeferredDataLoading}
    >
      {resolvedData.length > 0 || !hasLoadedData || hasColumnHeaderActions || quickFilters.length > 0 || advancedFilters.length > 0 ? (
        <>
          <div className="flex min-w-0 flex-col gap-3">
            {quickFilters.length ? (
              <div className={cn(
                "flex gap-x-4 gap-y-2",
                stackQuickFilterGroups ? "flex-col items-start" : "flex-wrap items-center",
              )}>
                {quickFilters.map((filter) => {
                  const explicitValue = searchParams.get(filter.param);
                  const synchronizedDefault = filter.syncQueryParams?.(
                    filter.defaultValue ?? "all",
                    new Date(),
                  );
                  const advancedParams = new Set([
                    ...Object.keys(synchronizedDefault ?? {}),
                    ...(filter.clearParamsOnChange ?? []),
                  ]);
                  const hasAdvancedOverride = [...advancedParams].some((param) =>
                    searchParams.has(param),
                  );
                  const defaultMatchesAdvanced = Object.keys(synchronizedDefault ?? {}).length > 0 &&
                    Object.entries(synchronizedDefault ?? {}).every(
                    ([param, value]) => (searchParams.get(param) ?? null) === value,
                  );
                  const customAdvancedValue = hasAdvancedOverride && !defaultMatchesAdvanced;
                  const selected = explicitValue ?? (
                    customAdvancedValue
                      ? ""
                      : filter.defaultValue && (!hasAdvancedOverride || defaultMatchesAdvanced)
                        ? filter.defaultValue
                        : "all"
                  );
                  return (
                    <div key={filter.param} className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">{filter.label}</span>
                      <ToggleGroup
                        type="single"
                        variant="outline"
                        size="sm"
                        value={selected}
                        onValueChange={(value) => {
                          if (value) updateQueryParam(filter.param, value === "all" ? (filter.allValue ?? "") : value);
                        }}
                        aria-label={filter.label}
                        className="flex-wrap"
                      >
                        <ToggleGroupItem value="all" aria-label={`Todos: ${filter.label}`}>Todos</ToggleGroupItem>
                        {filter.options.map((option) => (
                          <ToggleGroupItem key={option.value} value={option.value}>{option.label}</ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </div>
                  );
                })}
              </div>
            ) : null}

            <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-3">
            {showGlobalFilter && searchableColumnIds.length ? (
              <Input
                aria-label="Buscar en la tabla"
                autoComplete="off"
                placeholder={
                  filterPlaceholder ??
                  getGlobalFilterPlaceholder(
                    table,
                    searchableColumnIds,
                    columnLabels,
                  )
                }
                value={globalFilter}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="w-full min-w-0 md:max-w-lg"
              />
            ) : (
              <div />
            )}
            <div className="ml-auto flex w-full min-w-0 flex-wrap items-center justify-end gap-2 md:w-auto">
              {isPolling ? (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground" role="status" aria-live="polite">
                  <LoaderCircleIcon className="size-3.5 animate-spin" />
                  Actualizando
                </span>
              ) : null}
              {pollError || deferredDataError ? (
                <span className="flex max-w-full flex-wrap items-center gap-2 text-xs text-destructive" role="alert">
                  {resolvedData.length ? "No se pudo actualizar. Se muestran los últimos datos." : "No se pudieron cargar los datos."}
                  <Button variant="ghost" size="sm" onClick={() => revalidator.revalidate()} disabled={revalidator.state !== "idle"}>
                    Reintentar
                  </Button>
                </span>
              ) : null}
              {advancedFilters.length ? (
                <Popover open={filtersOpen} onOpenChange={(open) => {
                  if (open) {
                    const draft: Record<string, string> = {};
                    for (const filter of advancedFilters) {
                      const scopeValue = filter.scopeParam
                        ? searchParams.get(filter.scopeParam) ?? filter.scopeDefaultValue ?? filter.scopeOptions?.[0]?.value ?? ""
                        : "";
                      if (filter.scopeParam) draft[filter.scopeParam] = scopeValue;

                      const availableFields = scopeValue
                        ? filter.fieldOptionsByScope?.[scopeValue] ?? filter.fieldOptions
                        : filter.fieldOptions;
                      if (filter.fieldParam) {
                        draft[filter.fieldParam] =
                          searchParams.get(filter.fieldParam) ??
                          filter.fieldDefaultValue ??
                          availableFields?.[0]?.value ??
                          "";
                      }

                      if (isDateRangeFilter(filter)) {
                        const fromParam = filter.fromParam ?? `${filter.param}From`;
                        const toParam = filter.toParam ?? `${filter.param}To`;
                        draft[fromParam] = searchParams.get(fromParam) ?? "";
                        draft[toParam] = searchParams.get(toParam) ?? "";
                      } else draft[filter.param] = searchParams.get(filter.param) ?? "";
                    }
                    for (const quickFilter of quickFilters) {
                      const explicitQuickValue = searchParams.get(quickFilter.param);
                      const selectedValue = explicitQuickValue ?? quickFilter.defaultValue ?? "all";
                      const synchronizedParams = quickFilter.syncQueryParams?.(selectedValue, new Date());
                      const synchronizedEntries = Object.entries(synchronizedParams ?? {});
                      const shouldHydrateFromQuickFilter = explicitQuickValue !== null ||
                        !synchronizedEntries.some(([param]) => searchParams.has(param));
                      for (const [param, value] of synchronizedEntries) {
                        if (shouldHydrateFromQuickFilter) {
                          draft[param] = value ?? "";
                        }
                      }
                    }
                    setFilterDraft(draft);
                    setFilterDraftVersion((version) => version + 1);
                  }
                  setFiltersOpen(open);
                }}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <ListFilterIcon />
                      Filtros
                      {activeFilterCount ? <span className="rounded-full bg-primary px-1.5 text-[10px] leading-4 text-primary-foreground">{activeFilterCount}</span> : null}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="max-h-[80dvh] w-[calc(100vw-2rem)] max-w-[24rem] overflow-y-auto">
                    <PopoverHeader>
                      <PopoverTitle>Filtros personalizados</PopoverTitle>
                    </PopoverHeader>
                    <div className="grid gap-3">
                      {advancedFilters.map((filter) => {
                        const scopeValue = filter.scopeParam
                          ? filterDraft[filter.scopeParam] ?? filter.scopeDefaultValue ?? filter.scopeOptions?.[0]?.value ?? ""
                          : "";
                        const availableFields = scopeValue
                          ? filter.fieldOptionsByScope?.[scopeValue] ?? filter.fieldOptions
                          : filter.fieldOptions;
                        const fieldValue = filter.fieldParam
                          ? filterDraft[filter.fieldParam] ?? filter.fieldDefaultValue ?? availableFields?.[0]?.value ?? ""
                          : "";

                        return (
                          <div key={filter.param} className="grid gap-2">
                            <Label>{filter.label}</Label>
                            {filter.scopeParam ? (
                              <div className="grid min-w-0 gap-2 md:grid-cols-2">
                                <div className="grid gap-1.5">
                                  <Label htmlFor={`filter-${filter.scopeParam}`} className="text-xs text-muted-foreground">{filter.scopeLabel ?? "Buscar en"}</Label>
                                  <Select
                                    value={scopeValue}
                                    onValueChange={(value) => {
                                      const nextFields = filter.fieldOptionsByScope?.[value] ?? filter.fieldOptions;
                                      setFilterDraft((draft) => ({
                                        ...draft,
                                        [filter.scopeParam!]: value,
                                        ...(filter.fieldParam
                                          ? { [filter.fieldParam]: filter.fieldOptionsByScope ? nextFields?.[0]?.value ?? "" : draft[filter.fieldParam] ?? filter.fieldDefaultValue ?? "" }
                                          : {}),
                                      }));
                                    }}
                                  >
                                    <SelectTrigger id={`filter-${filter.scopeParam}`} className="min-w-0 w-full max-w-full"><SelectValue className="min-w-0 flex-1 truncate" /></SelectTrigger>
                                    <SelectContent>
                                      {filter.scopeOptions?.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </div>
                                {filter.fieldParam ? (
                                  <div className="grid gap-1.5">
                                    <Label htmlFor={`filter-${filter.fieldParam}`} className="text-xs text-muted-foreground">{filter.fieldLabel ?? "Campo"}</Label>
                                    <Select value={fieldValue} onValueChange={(value) => setFilterDraft((draft) => ({ ...draft, [filter.fieldParam!]: value }))}>
                                      <SelectTrigger id={`filter-${filter.fieldParam}`} className="min-w-0 w-full max-w-full"><SelectValue className="min-w-0 flex-1 truncate" /></SelectTrigger>
                                      <SelectContent>
                                        {availableFields?.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                            {filter.type === "date-time-range" ? (
                              <div className="grid min-w-0 grid-cols-1 gap-2 md:grid-cols-2">
                                {([
                                  [filter.fromParam ?? `${filter.param}From`, "Desde"],
                                  [filter.toParam ?? `${filter.param}To`, "Hasta"],
                                ] as const).map(([param, label]) => (
                                  <div key={param} className="grid min-w-0 gap-1.5">
                                    <Label htmlFor={`filter-${param}`} className="text-xs text-muted-foreground">{label}</Label>
                                    <DateTimePicker
                                      key={`${param}-${filterDraftVersion}`}
                                      id={`filter-${param}`}
                                      className="mx-0 w-full"
                                      defaultValue={parseDateTimeFilterValue(filterDraft[param])}
                                      onChange={(value) => {
                                        setFilterDraft((draft) => ({
                                          ...draft,
                                          [param]: value ? formatDateTimeFilterValue(value) : "",
                                        }));
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : filter.type === "date-range" ? (
                              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                <Input aria-label={`${filter.label}: desde`} type="date" value={filterDraft[filter.fromParam ?? `${filter.param}From`] ?? ""} onChange={(event) => setFilterDraft((draft) => ({ ...draft, [filter.fromParam ?? `${filter.param}From`]: event.target.value }))} />
                                <Input aria-label={`${filter.label}: hasta`} type="date" value={filterDraft[filter.toParam ?? `${filter.param}To`] ?? ""} onChange={(event) => setFilterDraft((draft) => ({ ...draft, [filter.toParam ?? `${filter.param}To`]: event.target.value }))} />
                              </div>
                            ) : filter.type === "select" ? (
                              <Select value={filterDraft[filter.param] || "all"} onValueChange={(value) => setFilterDraft((draft) => ({ ...draft, [filter.param]: value === "all" ? "" : value }))}>
                                <SelectTrigger id={`filter-${filter.param}`} className="w-full"><SelectValue placeholder="Todos" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">Todos</SelectItem>
                                  {filter.options?.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input id={`filter-${filter.param}`} type={filter.type} value={filterDraft[filter.param] ?? ""} onChange={(event) => setFilterDraft((draft) => ({ ...draft, [filter.param]: event.target.value }))} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                      <Button variant="ghost" size="sm" className="w-full sm:w-auto" onClick={resetFilters}><RotateCcwIcon /> Restablecer</Button>
                      <Button size="sm" className="w-full sm:w-auto" onClick={applyAdvancedFilters}>Aplicar filtros</Button>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : null}
              {activeFilterCount ? <Button variant="ghost" size="sm" onClick={resetFilters}>Limpiar</Button> : null}
              {showColumnVisibility ? <DataTableViewOptions table={table} columnLabels={columnLabels} /> : null}
            </div>
            </div>
          </div>

          <div
            ref={tableViewportRef}
            className="overflow-hidden rounded-xl border bg-card shadow-sm"
          >
            <Table className={cn(fitColumns && "lg:table-fixed")}>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className={cn("text-base!", fitColumns && "lg:!text-xs")}
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className={cn(
                          fitColumns && "lg:h-9 lg:overflow-hidden lg:px-1.5 lg:text-ellipsis lg:text-xs",
                          stickyRightColumnIds.includes(header.column.id) &&
                            "sticky right-0 z-30 border-l bg-background",
                          header.column.id === "actions" &&
                            stickyRightColumnIds.includes(header.column.id) &&
                            "w-36 min-w-36 max-w-36",
                        )}
                      >
                        {renderHeader(
                          header,
                          columnLabels,
                          columnHeaderActions?.[header.column.id],
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className={cn(
                        "group text-base",
                        fitColumns && "lg:text-xs",
                        onRowClick &&
                          "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                      )}
                      onClick={
                        onRowClick
                          ? (event) => {
                              const target = event.target;
                              if (
                                target instanceof Element &&
                                target.closest(
                                  "a, button, input, select, textarea, [role='button'], [role='menuitem'], [data-row-click-ignore='true']",
                                )
                              ) {
                                return;
                              }
                              onRowClick(row.original);
                            }
                          : undefined
                      }
                      onKeyDown={
                        onRowClick
                          ? (event) => {
                              if (
                                event.target !== event.currentTarget ||
                                (event.key !== "Enter" && event.key !== " ")
                              ) {
                                return;
                              }
                              event.preventDefault();
                              onRowClick(row.original);
                            }
                          : undefined
                      }
                      tabIndex={onRowClick ? 0 : undefined}
                      aria-haspopup={onRowClick ? "dialog" : undefined}
                      aria-label={getRowLabel?.(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            fitColumns && "lg:overflow-hidden lg:px-1.5 lg:py-2 lg:text-ellipsis lg:text-xs",
                            stickyRightColumnIds.includes(cell.column.id) &&
                              "sticky right-0 z-30 border-l bg-background group-hover:bg-muted",
                            cell.column.id === "actions" &&
                              stickyRightColumnIds.includes(cell.column.id) &&
                              "w-36 min-w-36 max-w-36",
                          )}
                        >
                          {stickyRightColumnIds.length > 0 &&
                          !stickyRightColumnIds.includes(cell.column.id) ? (
                            <div className="min-w-0 max-w-full overflow-hidden text-ellipsis focus-within:overflow-visible">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </div>
                          ) : (
                            flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : deferredDataError && resolvedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={table.getVisibleLeafColumns().length} className="h-24 text-center text-muted-foreground">
                      No se pudieron cargar los datos de esta tabla.
                    </TableCell>
                  </TableRow>
                ) : !hasLoadedData ? (
                  Array.from({ length: 5 }, (_, rowIndex) => (
                    <TableRow key={`loading-${rowIndex}`} aria-hidden="true">
                      {table.getVisibleLeafColumns().map((column, columnIndex) => (
                        <TableCell
                          key={column.id}
                          className={cn(
                            stickyRightColumnIds.includes(column.id) &&
                              "sticky right-0 z-30 border-l bg-background",
                            column.id === "actions" &&
                              stickyRightColumnIds.includes(column.id) &&
                              "w-36 min-w-36 max-w-36",
                          )}
                        >
                          <Skeleton className={`h-5 ${columnIndex === 0 ? "w-2/3" : "w-full max-w-48"}`} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={table.getVisibleLeafColumns().length}
                      className="h-24 text-center"
                    >
                      {resolvedData.length === 0 ? (
                        <Empty>
                          <EmptyHeader>
                            <EmptyTitle>{empty?.title ?? "No hay datos"}</EmptyTitle>
                            <EmptyDescription>
                              {empty?.description ??
                                "No se han encontrado datos para mostrar"}
                            </EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      ) : (
                        "Sin resultados."
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div ref={paginationFooterRef}>
            <DataTablePagination table={table} />
          </div>
        </>
      ) : (
        <div className="overflow-hidden rounded-md border">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>{empty?.title ?? "No hay datos"}</EmptyTitle>
              <EmptyDescription>
                {empty?.description ??
                  "No se han encontrado datos para mostrar"}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      )}
    </div>
  );
}

const lastTablePollAt = new Map<string, number>();

function getStableDataTableRowId(row: unknown, index: number) {
  if (row && typeof row === "object" && "id" in row) {
    const id = (row as { id?: unknown }).id;
    if (typeof id === "string" || typeof id === "number") return String(id);
  }
  return String(index);
}

function areDataTableRowsEqual<TData>(current: TData[], next: TData[]) {
  if (current.length !== next.length) return false;
  try {
    return JSON.stringify(current) === JSON.stringify(next);
  } catch {
    return false;
  }
}

function isPromiseLike<T>(value: T[] | PromiseLike<T[]>): value is PromiseLike<T[]> {
  return typeof value === "object" && value !== null && "then" in value && typeof value.then === "function";
}

function useDataTablePolling(
  intervalMs: number,
  dataKey: string | undefined,
  fetcherRef: React.RefObject<ReturnType<typeof useFetcher<Record<string, unknown>>>>,
  hrefRef: React.RefObject<string>,
  latestDataRef: React.RefObject<unknown[]>,
  pendingPollRef: React.RefObject<{
    href: string;
    data: unknown;
    sourceData: unknown[];
  } | null>,
  pollTimeoutRef: React.RefObject<ReturnType<typeof setTimeout> | null>,
  setIsPolling: React.Dispatch<React.SetStateAction<boolean>>,
  setPollError: React.Dispatch<React.SetStateAction<boolean>>,
) {
  React.useEffect(() => {
    if (intervalMs <= 0 || !dataKey) return;

    const refreshTable = () => {
      if (document.visibilityState !== "visible") return;
      const currentFetcher = fetcherRef.current;
      if (!currentFetcher || currentFetcher.state !== "idle") return;
      if (pendingPollRef.current) return;

      const href = hrefRef.current;
      const routeKey = window.location.pathname;
      const now = Date.now();
      if (now - (lastTablePollAt.get(routeKey) ?? 0) < 1_000) return;
      lastTablePollAt.set(routeKey, now);
      const pendingPoll = {
        href,
        data: currentFetcher.data,
        sourceData: latestDataRef.current,
      };
      pendingPollRef.current = pendingPoll;
      setIsPolling(true);
      setPollError(false);
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = setTimeout(() => {
        if (pendingPollRef.current !== pendingPoll) return;
        pendingPollRef.current = null;
        pollTimeoutRef.current = null;
        setIsPolling(false);
        setPollError(true);
        fetcherRef.current.reset();
      }, 15_000);
      const refreshUrl = new URL(href, window.location.origin);
      refreshUrl.searchParams.set("__tableOnly", "1");
      refreshUrl.searchParams.set("index", "");
      currentFetcher.load(`${refreshUrl.pathname}${refreshUrl.search}`);
    };

    const intervalId = window.setInterval(refreshTable, intervalMs);
    document.addEventListener("visibilitychange", refreshTable);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshTable);
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
      pendingPollRef.current = null;
      setIsPolling(false);
    };
  }, [dataKey, fetcherRef, hrefRef, intervalMs, latestDataRef, pendingPollRef, pollTimeoutRef, setIsPolling, setPollError]);
}

function filterRowsLocally<TData>(
  data: TData[],
  quickFilters: DataTableQuickFilterGroup<TData>[],
  advancedFilters: DataTableAdvancedFilter[],
  searchParams: URLSearchParams,
) {
  return data.filter((row) => {
    for (const filter of quickFilters) {
      const value = searchParams.get(filter.param);
      if (!value || value === filter.allValue) continue;
      const option = filter.options.find((candidate) => candidate.value === value);
      if (!option) continue;
      if (option.predicate && !option.predicate(row)) return false;
      if (filter.columnId) {
        const expected = option.matchValue ?? option.value;
        if (String(getValueAtPath(row, filter.columnId) ?? "") !== String(expected)) {
          return false;
        }
      }
    }

    for (const filter of advancedFilters) {
      if (!filter.columnId) continue;
      const rawValue = getValueAtPath(row, filter.columnId);
      if (isDateRangeFilter(filter)) {
        const valueTime = rawValue instanceof Date ? rawValue.getTime() : new Date(String(rawValue ?? "")).getTime();
        const fromParam = filter.fromParam ?? `${filter.param}From`;
        const toParam = filter.toParam ?? `${filter.param}To`;
        const fromTime = searchParams.get(fromParam) ? getDateRangeBoundary(searchParams.get(fromParam)!, false, filter.type) : undefined;
        const toTime = searchParams.get(toParam) ? getDateRangeBoundary(searchParams.get(toParam)!, true, filter.type) : undefined;
        if (Number.isNaN(valueTime)) continue;
        if (fromTime !== undefined && valueTime < fromTime) return false;
        if (toTime !== undefined && valueTime > toTime) return false;
        continue;
      }

      const value = searchParams.get(filter.param);
      if (!value) continue;
      if (filter.type === "text") {
        if (!String(rawValue ?? "").toLowerCase().includes(value.toLowerCase())) return false;
      } else if (filter.type === "date") {
        const actual = rawValue instanceof Date ? rawValue.toISOString().slice(0, 10) : String(rawValue ?? "").slice(0, 10);
        if (actual !== value) return false;
      } else if (String(rawValue ?? "") !== value) {
        return false;
      }
    }
    return true;
  });
}

function isDateRangeFilter(filter: DataTableAdvancedFilter) {
  return filter.type === "date-range" || filter.type === "date-time-range";
}

function parseDateTimeFilterValue(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateTimeFilterValue(value: Date) {
  return value.toISOString();
}

function getDateRangeBoundary(value: string, isEnd: boolean, type: DataTableAdvancedFilter["type"]) {
  const date = new Date(
    type === "date-time-range" ? value : `${value.slice(0, 10)}T00:00:00`,
  );
  if (Number.isNaN(date.getTime())) return Number.NaN;
  if (type === "date-time-range") {
    if (isEnd) date.setSeconds(59, 999);
  } else if (isEnd) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  return date.getTime();
}

function getValueAtPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object") {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, value);
}

export function DataTablePagination<TData>({ table }: { table: TanstackTable<TData> }) {
  return (
    <div className="flex max-w-full justify-between">
      <div className="text-muted-foreground text-sm md:text-base tabular-nums w-fit">
        {table.getFilteredRowModel().rows.length} resultado(s) de&nbsp;
        {table.getCoreRowModel().rows.length}
      </div>

      <div className="flex flex-col gap-y-3 justify-end">
        <div className="flex flex-col md:flex-row md:items-center items-end gap-3">
          <div className="tabular-nums text-sm md:text-base font-medium w-fit">
            <span>
              Página&nbsp;{table.getState().pagination.pageIndex + 1}
              &nbsp;de&nbsp;
              {table.getPageCount() || 1}
            </span>
          </div>

          <div className="flex items-center justify-center gap-1.5 sm:justify-end sm:gap-2">
            <Button
              variant="outline"
              size="icon"
              className="hidden sm:inline-flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Ir a la primera página</span>
              <ChevronsLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Ir a la página anterior</span>
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Ir a la página siguiente</span>
              <ChevronRightIcon />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="hidden sm:inline-flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Ir a la última página</span>
              <ChevronsRightIcon />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DataTableViewOptions<TData>({
  table,
  columnLabels,
}: {
  table: TanstackTable<TData>;
  columnLabels?: Partial<Record<string, string>>;
}) {
  const columns = table
    .getAllColumns()
    .filter((column) => column.getCanHide() && isDataColumn(column));

  if (!columns.length) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-fit ms-auto text-base gap-3"
        >
          <Columns3Icon data-icon="inline-start" />
          Ver columnas
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-2xs">
        <DropdownMenuLabel className="text-sm">
          Columnas visibles
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={column.getIsVisible()}
            onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
            className="text-base"
          >
            {getColumnLabel(column, columnLabels)}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function renderHeader<TData>(
  header: Header<TData, any>,
  columnLabels?: Partial<Record<string, string>>,
  configuredAction?:
    | React.ReactNode
    | ((column: Column<TData, any>) => React.ReactNode),
) {
  if (header.isPlaceholder) {
    return null;
  }

  const { column } = header;
  const action =
    typeof configuredAction === "function"
      ? configuredAction(column)
      : configuredAction;

  const content =
    typeof column.columnDef.header === "string" && column.getCanSort() ? (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 h-8 px-2 text-base"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>{getColumnLabel(column, columnLabels)}</span>
        <SortIcon direction={column.getIsSorted()} />
      </Button>
    ) : (
      flexRender(column.columnDef.header, header.getContext())
    );

  return action ? (
    <div className="flex min-w-max items-center gap-1">
      {content}
      {action}
    </div>
  ) : (
    content
  );
}

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  if (direction === "asc") {
    return <ArrowUpIcon data-icon="inline-end" />;
  }

  if (direction === "desc") {
    return <ArrowDownIcon data-icon="inline-end" />;
  }

  return <ArrowUpDownIcon data-icon="inline-end" />;
}

function getSearchableColumnIds<TData>(
  columns: ColumnDef<TData, any>[],
  globalFilterColumns?: readonly string[],
) {
  const availableColumnIds = columns.flatMap((column) => getColumnIds(column));

  if (globalFilterColumns?.length) {
    return globalFilterColumns.filter((columnId) =>
      availableColumnIds.includes(columnId),
    );
  }

  return availableColumnIds.slice(0, 1);
}

function isDataColumn<TData>(column: Column<TData, any>) {
  return typeof column.accessorFn !== "undefined";
}

function getColumnIds<TData>(column: ColumnDef<TData, any>): string[] {
  if ("columns" in column && Array.isArray(column.columns)) {
    return column.columns.flatMap((nestedColumn) => getColumnIds(nestedColumn));
  }

  if ("id" in column && typeof column.id === "string") {
    return [column.id];
  }

  if ("accessorKey" in column && typeof column.accessorKey === "string") {
    return [column.accessorKey];
  }

  if (
    "accessorFn" in column &&
    "id" in column &&
    typeof column.id === "string"
  ) {
    return [column.id];
  }

  return [];
}

function matchesGlobalFilter<TData>(
  row: Row<TData>,
  columnIds: string[],
  filterValue: unknown,
) {
  const searchTerm = String(filterValue ?? "")
    .trim()
    .toLowerCase();

  if (!searchTerm) {
    return true;
  }

  return columnIds.some((columnId) => {
    const value = row.getValue(columnId);
    return String(value ?? "")
      .toLowerCase()
      .includes(searchTerm);
  });
}

function getGlobalFilterPlaceholder<TData>(
  table: TanstackTable<TData>,
  columnIds: string[],
  columnLabels?: Partial<Record<string, string>>,
) {
  const labels = columnIds.map((columnId) => {
    const column = table.getColumn(columnId);

    if (column) {
      return getColumnLabel(column, columnLabels).toLowerCase();
    }

    return columnId.replace(/[_-]+/g, " ").toLowerCase();
  });

  return `Buscar por ${labels.join(", ")}…`;
}

function getColumnLabel<TData>(
  column: Column<TData, any>,
  columnLabels?: Partial<Record<string, string>>,
) {
  if (columnLabels?.[column.id]) {
    return columnLabels[column.id] as string;
  }

  if (typeof column.columnDef.header === "string") {
    return column.columnDef.header;
  }

  return column.id
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
