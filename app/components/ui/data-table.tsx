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
  type Header,
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
} from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectGroup,
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

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  globalFilterColumns?: string[];
  filterPlaceholder?: string;
  pageSizeOptions?: number[];
  columnLabels?: Partial<Record<string, string>>;
  empty?: Partial<{
    title: string;
    description: string;
  }>;
}

export default function DataTable<TData>({
  columns,
  data,
  globalFilterColumns,
  filterPlaceholder,
  pageSizeOptions = [10, 20, 30, 40, 50],
  columnLabels,
  empty,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const searchableColumnIds = React.useMemo(
    () => getSearchableColumnIds(columns, globalFilterColumns),
    [columns, globalFilterColumns],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, _columnId, filterValue) =>
      matchesGlobalFilter(row, searchableColumnIds, filterValue),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    initialState: {
      pagination: {
        pageSize: pageSizeOptions[0] ?? 10,
      },
    },
    state: {
      sorting,
      globalFilter,
      columnVisibility,
    },
  });

  return (
    <div className="flex flex-col gap-4">
      {data.length > 0 ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {searchableColumnIds.length ? (
              <Input
                placeholder={
                  filterPlaceholder ??
                  getGlobalFilterPlaceholder(searchableColumnIds, columnLabels)
                }
                value={globalFilter}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="w-full sm:max-w-sm"
              />
            ) : (
              <div />
            )}
            <DataTableViewOptions table={table} columnLabels={columnLabels} />
          </div>

          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {renderHeader(header, columnLabels)}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
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
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <DataTablePagination
            table={table}
            pageSizeOptions={pageSizeOptions}
          />
        </>
      ) : (
        <div className="overflow-hidden rounded-md border">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>{empty?.title ?? "No hay datos"}</EmptyTitle>
              <EmptyDescription>
                {empty?.description ?? "No se han encontrado datos para mostrar"}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      )}
    </div>
  );
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions,
}: {
  table: TanstackTable<TData>;
  pageSizeOptions: number[];
}) {
  return (
    <div className="flex flex-col gap-4 px-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted-foreground">
        {table.getFilteredRowModel().rows.length} resultado(s) de {table.getCoreRowModel().rows.length}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">Filas por pagina</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="w-20" size="sm">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {pageSizeOptions.map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-center text-sm font-medium sm:min-w-28">
          Pagina {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            className="hidden sm:inline-flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Ir a la primera pagina</span>
            <ChevronsLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Ir a la pagina anterior</span>
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Ir a la pagina siguiente</span>
            <ChevronRightIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            className="hidden sm:inline-flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Ir a la ultima pagina</span>
            <ChevronsRightIcon />
          </Button>
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
        <Button variant="outline" size="sm" className="sm:ml-auto">
          <Columns3Icon data-icon="inline-start" />
          Ver columnas
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={column.getIsVisible()}
            onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
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
) {
  if (header.isPlaceholder) {
    return null;
  }

  const { column } = header;

  if (typeof column.columnDef.header === "string" && column.getCanSort()) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 h-8 px-2"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>{getColumnLabel(column, columnLabels)}</span>
        <SortIcon direction={column.getIsSorted()} />
      </Button>
    );
  }

  return flexRender(column.columnDef.header, header.getContext());
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
  globalFilterColumns?: string[],
) {
  const availableColumnIds = columns.flatMap((column) => getColumnIds(column));

  if (globalFilterColumns?.length) {
    return globalFilterColumns
      .slice(0, 3)
      .filter((columnId) => availableColumnIds.includes(columnId));
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

  if ("accessorKey" in column && typeof column.accessorKey === "string") {
    return [column.accessorKey];
  }

  if ("accessorFn" in column && "id" in column && typeof column.id === "string") {
    return [column.id];
  }

  return [];
}

function matchesGlobalFilter<TData>(
  row: Row<TData>,
  columnIds: string[],
  filterValue: unknown,
) {
  const searchTerm = String(filterValue ?? "").trim().toLowerCase();

  if (!searchTerm) {
    return true;
  }

  return columnIds.some((columnId) => {
    const value = row.getValue(columnId);
    return String(value ?? "").toLowerCase().includes(searchTerm);
  });
}

function getGlobalFilterPlaceholder(
  columnIds: string[],
  columnLabels?: Partial<Record<string, string>>,
) {
  const labels = columnIds.map((columnId) => {
    if (columnLabels?.[columnId]) {
      return columnLabels[columnId] as string;
    }

    return columnId.replace(/[_-]+/g, " ").toLowerCase();
  });

  return `Buscar por ${labels.join(", ")}...`;
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
