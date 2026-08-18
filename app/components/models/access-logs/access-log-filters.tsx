import { RotateCcwIcon, SlidersHorizontalIcon } from "lucide-react";
import { useNavigate } from "react-router";
import type { DateRange } from "react-day-picker";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { DatePicker } from "~/components/ui/date-picker";
import { DateRangePicker } from "~/components/ui/date-range-picker";
import { Field, FieldGroup, FieldLabel } from "~/components/ui/field";
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

type AccessLogFiltersProps = {
  basePath: string;
  mode: FilterMode;
  date?: Date;
  dateRange?: DateRange;
  status?: string | null;
};

function formatDate(date: Date) {
  return formatTimestamp({ date, template: "yyyy-MM-dd" });
}

export default function AccessLogFilters({
  basePath,
  mode,
  date,
  dateRange,
  status,
}: AccessLogFiltersProps) {
  const navigate = useNavigate();
  const selectedStatus: FilterStatus =
    status === "INSIDE" || status === "OUTSIDE" ? status : "ALL";
  const referenceDate = dateRange?.from ?? date ?? new Date();

  function navigateWith(params: URLSearchParams) {
    navigate(`${basePath}?${params.toString()}`);
  }

  function addStatus(params: URLSearchParams, nextStatus = selectedStatus) {
    if (nextStatus !== "ALL") {
      params.set("status", nextStatus);
    }
    return params;
  }

  function getPeriodParams() {
    const params = new URLSearchParams();

    if (mode === "range") {
      params.set("dateFrom", formatDate(dateRange?.from ?? referenceDate));
      params.set("dateTo", formatDate(dateRange?.to ?? referenceDate));
    } else {
      params.set("date", formatDate(date ?? referenceDate));
    }

    return params;
  }

  function handleModeChange(nextMode: FilterMode) {
    const params = new URLSearchParams();
    const value = formatDate(referenceDate);

    if (nextMode === "range") {
      params.set("dateFrom", value);
      params.set("dateTo", value);
    } else {
      params.set("date", value);
    }

    navigateWith(addStatus(params));
  }

  function handleStatusChange(nextStatus: FilterStatus) {
    navigateWith(addStatus(getPeriodParams(), nextStatus));
  }

  function resetFilters() {
    navigateWith(new URLSearchParams({ date: formatDate(new Date()) }));
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SlidersHorizontalIcon aria-hidden="true" />
          Filtros
        </CardTitle>
        <CardDescription>
          Acota los registros por periodo y estado.
        </CardDescription>
        <CardAction>
          <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
            <RotateCcwIcon data-icon="inline-start" aria-hidden="true" />
            Restablecer
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <FieldGroup className="grid gap-3 md:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="access-log-filter-mode">Periodo</FieldLabel>
            <Select
              value={mode}
              onValueChange={(value) => handleModeChange(value as FilterMode)}
            >
              <SelectTrigger id="access-log-filter-mode" className="w-full">
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
            <FieldLabel htmlFor="access-log-filter-date">
              {mode === "single" ? "Fecha" : "Rango"}
            </FieldLabel>
            {mode === "single" ? (
              <DatePicker
                id="access-log-filter-date"
                className="m-0 w-full"
                value={date}
                onChange={(value) => {
                  if (!value) return;
                  const params = new URLSearchParams({ date: formatDate(value) });
                  navigateWith(addStatus(params));
                }}
              />
            ) : (
              <DateRangePicker
                name="access-log-filter-date"
                className="m-0 w-full"
                value={dateRange}
                numberOfMonths={1}
                onChange={(range) => {
                  if (!range?.from || !range.to) return;
                  const params = new URLSearchParams({
                    dateFrom: formatDate(range.from),
                    dateTo: formatDate(range.to),
                  });
                  navigateWith(addStatus(params));
                }}
              />
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="access-log-filter-status">Estado</FieldLabel>
            <Select
              value={selectedStatus}
              onValueChange={(value) =>
                handleStatusChange(value as FilterStatus)
              }
            >
              <SelectTrigger id="access-log-filter-status" className="w-full">
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
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
