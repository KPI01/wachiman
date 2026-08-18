import { ListFilterIcon, RotateCcwIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import type { DateRange } from "react-day-picker";
import { Button } from "~/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { formatTimestamp } from "~/lib/utils";

type FilterMode = "single" | "range";
type FilterStatus = "ALL" | "INSIDE" | "OUTSIDE";
type FilterKind = "period" | "status";

type AccessLogFiltersProps = {
  basePath: string;
  filter: FilterKind;
  mode: FilterMode;
  date?: Date;
  dateRange?: DateRange;
  status?: string | null;
};

function formatDate(date: Date) {
  return formatTimestamp({ date, template: "yyyy-MM-dd" });
}

function formatDisplayDate(date: Date) {
  return formatTimestamp({ date, template: "dd/MM/yyyy" });
}

export default function AccessLogFilters({
  basePath,
  filter,
  mode,
  date,
  dateRange,
  status,
}: AccessLogFiltersProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedStatus: FilterStatus =
    status === "INSIDE" || status === "OUTSIDE" ? status : "ALL";
  const today = new Date();
  const referenceDate = dateRange?.from ?? date ?? today;
  const todayValue = formatDate(today);
  const [open, setOpen] = useState(false);
  const [draftMode, setDraftMode] = useState<FilterMode>(mode);
  const [draftDate, setDraftDate] = useState(
    formatDate(date ?? referenceDate),
  );
  const [draftDateFrom, setDraftDateFrom] = useState(
    formatDate(dateRange?.from ?? referenceDate),
  );
  const [draftDateTo, setDraftDateTo] = useState(
    formatDate(dateRange?.to ?? referenceDate),
  );
  const periodIsActive =
    mode === "range" || formatDate(date ?? referenceDate) !== todayValue;
  const statusIsActive = selectedStatus !== "ALL";
  const periodSummary =
    mode === "range"
      ? `${formatDisplayDate(dateRange?.from ?? referenceDate)}–${formatDisplayDate(dateRange?.to ?? referenceDate)}`
      : formatDate(date ?? referenceDate) === todayValue
        ? "Hoy"
        : formatDisplayDate(date ?? referenceDate);
  const statusSummary =
    selectedStatus === "INSIDE"
      ? "Dentro"
      : selectedStatus === "OUTSIDE"
        ? "Fuera"
        : "Todos";
  const active = filter === "period" ? periodIsActive : statusIsActive;
  const summary = filter === "period" ? periodSummary : statusSummary;
  const label = filter === "period" ? "Filtrar ingresos" : "Filtrar salidas";

  function navigateWith(params: URLSearchParams) {
    setOpen(false);
    navigate(`${basePath}?${params.toString()}`);
  }

  function paramsWithoutPeriod() {
    const params = new URLSearchParams(searchParams);
    params.delete("date");
    params.delete("dateFrom");
    params.delete("dateTo");
    return params;
  }

  function handlePopoverOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) return;

    setDraftMode(mode);
    setDraftDate(formatDate(date ?? referenceDate));
    setDraftDateFrom(formatDate(dateRange?.from ?? referenceDate));
    setDraftDateTo(formatDate(dateRange?.to ?? referenceDate));
  }

  function applyPeriodFilter() {
    const params = paramsWithoutPeriod();

    if (draftMode === "range") {
      if (!draftDateFrom || !draftDateTo || draftDateFrom > draftDateTo) {
        return;
      }
      params.set("dateFrom", draftDateFrom);
      params.set("dateTo", draftDateTo);
    } else {
      if (!draftDate) return;
      params.set("date", draftDate);
    }

    navigateWith(params);
  }

  function handleStatusChange(nextStatus: FilterStatus) {
    const params = new URLSearchParams(searchParams);

    if (nextStatus === "ALL") {
      params.delete("status");
    } else {
      params.set("status", nextStatus);
    }

    navigateWith(params);
  }

  function resetFilters() {
    navigateWith(new URLSearchParams({ date: todayValue }));
  }

  return (
    <div className="flex items-center gap-1">
      <span
        className="max-w-28 truncate text-xs font-normal text-muted-foreground"
        title={summary}
      >
        {summary}
      </span>
      <Popover open={open} onOpenChange={handlePopoverOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant={active ? "secondary" : "ghost"}
            size="icon-xs"
            aria-label={label}
            aria-pressed={active}
          >
            <ListFilterIcon aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start">
          {filter === "period" ? (
            <>
              <PopoverHeader>
                <PopoverTitle>Filtrar por periodo</PopoverTitle>
                <PopoverDescription>
                  Selecciona una fecha concreta o un rango de ingresos.
                </PopoverDescription>
              </PopoverHeader>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="access-log-header-filter-mode">
                    Periodo
                  </FieldLabel>
                  <Select
                    value={draftMode}
                    onValueChange={(value) => setDraftMode(value as FilterMode)}
                  >
                    <SelectTrigger
                      id="access-log-header-filter-mode"
                      className="w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="single">Fecha específica</SelectItem>
                        <SelectItem value="range">Rango de fechas</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="access-log-header-filter-date">
                    {draftMode === "single" ? "Fecha" : "Rango"}
                  </FieldLabel>
                  {draftMode === "single" ? (
                    <Input
                      id="access-log-header-filter-date"
                      type="date"
                      value={draftDate}
                      onChange={(event) => setDraftDate(event.target.value)}
                    />
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        id="access-log-header-filter-date"
                        aria-label="Fecha inicial"
                        type="date"
                        value={draftDateFrom}
                        max={draftDateTo}
                        onChange={(event) =>
                          setDraftDateFrom(event.target.value)
                        }
                      />
                      <Input
                        aria-label="Fecha final"
                        type="date"
                        value={draftDateTo}
                        min={draftDateFrom}
                        onChange={(event) =>
                          setDraftDateTo(event.target.value)
                        }
                      />
                    </div>
                  )}
                </Field>
              </FieldGroup>
            </>
          ) : (
            <>
              <PopoverHeader>
                <PopoverTitle>Filtrar por estado</PopoverTitle>
                <PopoverDescription>
                  Muestra las personas que siguen dentro o que ya salieron.
                </PopoverDescription>
              </PopoverHeader>
              <Field>
                <FieldLabel htmlFor="access-log-header-filter-status">
                  Estado
                </FieldLabel>
                <Select
                  value={selectedStatus}
                  onValueChange={(value) =>
                    handleStatusChange(value as FilterStatus)
                  }
                >
                  <SelectTrigger
                    id="access-log-header-filter-status"
                    className="w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="ALL">Todos</SelectItem>
                      <SelectItem value="INSIDE">Dentro</SelectItem>
                      <SelectItem value="OUTSIDE">Fuera</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </>
          )}
          {filter === "period" ? (
            <Button
              type="button"
              size="sm"
              className="w-full"
              disabled={
                draftMode === "single"
                  ? !draftDate
                  : !draftDateFrom ||
                    !draftDateTo ||
                    draftDateFrom > draftDateTo
              }
              onClick={applyPeriodFilter}
            >
              Aplicar filtros
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={resetFilters}
          >
            <RotateCcwIcon data-icon="inline-start" aria-hidden="true" />
            Restablecer filtros
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
