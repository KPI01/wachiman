import type { Column } from "@tanstack/react-table";
import { ListFilterIcon, RotateCcwIcon } from "lucide-react";
import { useId } from "react";
import { Button } from "~/components/ui/button";
import { Field, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "~/components/ui/popover";

type AccessLogColumnFilterProps<TData> = {
  column: Column<TData, unknown>;
  label: string;
};

export default function AccessLogColumnFilter<TData>({
  column,
  label,
}: AccessLogColumnFilterProps<TData>) {
  const inputId = useId();
  const value = String(column.getFilterValue() ?? "");
  const active = value.trim().length > 0;
  const lowercaseLabel = label.toLocaleLowerCase("es");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={active ? "secondary" : "ghost"}
          size="icon-xs"
          aria-label={`Filtrar por ${lowercaseLabel}`}
          aria-pressed={active}
        >
          <ListFilterIcon aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start">
        <PopoverHeader>
          <PopoverTitle>Filtrar por {lowercaseLabel}</PopoverTitle>
          <PopoverDescription>
            Escribe una parte del valor que quieres encontrar.
          </PopoverDescription>
        </PopoverHeader>
        <Field>
          <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
          <Input
            id={inputId}
            autoComplete="off"
            value={value}
            placeholder={`Buscar por ${lowercaseLabel}...`}
            onChange={(event) => column.setFilterValue(event.target.value)}
          />
        </Field>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          disabled={!active}
          onClick={() => column.setFilterValue(undefined)}
        >
          <RotateCcwIcon data-icon="inline-start" aria-hidden="true" />
          Limpiar filtro
        </Button>
      </PopoverContent>
    </Popover>
  );
}
