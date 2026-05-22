import { parse } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { IMaskInput } from "react-imask";
import { Calendar } from "./calendar";
import { InputGroup, InputGroupAddon, InputGroupButton } from "./input-group";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn, formatTimestamp } from "~/lib/utils";

const DATE_RANGE_DIGIT_SLOTS = [
  0, 1, 3, 4, 6, 7, 8, 9, 13, 14, 16, 17, 19, 20, 21, 22,
];

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false;
  }
  return !isNaN(date.getTime());
}

function stripTime(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, DATE_RANGE_DIGIT_SLOTS.length);
}

function formatValueForImask(digits: string) {
  let result = "";
  let digitIndex = 0;
  const mask = "00/00/0000 - 00/00/0000";

  for (let i = 0; i < mask.length; i++) {
    if (mask[i] === "0") {
      result += digits[digitIndex] || "_";
      digitIndex++;
    } else {
      result += mask[i];
    }
  }

  return result;
}

function getDigitsFromDate(date: Date) {
  return formatTimestamp({ date, template: "ddMMyyyy" });
}

function getDateFromDigits(digits: string) {
  if (digits.length < 8) {
    return undefined;
  }

  const parsed = parse(digits, "ddMMyyyy", new Date(), { locale: es });
  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));

  if (
    !isValidDate(parsed) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return undefined;
  }

  return stripTime(parsed);
}

function normalizeRange(range: DateRange | undefined): DateRange | undefined {
  if (!range || !range.from) {
    return undefined;
  }
  return {
    from: stripTime(range.from),
    to: range.to ? stripTime(range.to) : undefined,
  };
}

function formatRange(range: DateRange | undefined): string {
  if (!range?.from) {
    return formatValueForImask("");
  }

  return formatValueForImask(
    `${getDigitsFromDate(range.from)}${range.to ? getDigitsFromDate(range.to) : ""}`,
  );
}

function getRangeFromDigits(digits: string): DateRange | undefined {
  const from = getDateFromDigits(digits.slice(0, 8));
  const to = getDateFromDigits(digits.slice(8, 16));

  if (!from) {
    return undefined;
  }

  return { from, to };
}

interface DateRangePickerProps {
  name?: string;
  defaultValue?: DateRange;
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  className?: string;
  placeholder?: string;
  numberOfMonths?: number;
}

export function DateRangePicker({
  name,
  defaultValue,
  value: valueProp,
  onChange,
  className,
  placeholder = "DD/MM/YYYY hh:mm",
  numberOfMonths = 2,
}: DateRangePickerProps) {
  const initialRange = normalizeRange(
    valueProp !== undefined ? valueProp : defaultValue,
  );
  const fallbackMonth =
    initialRange?.from ?? new Date(new Date().getFullYear(), 0, 1);

  const [open, setOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(
    initialRange,
  );
  const [calendarMonth, setCalendarMonth] = useState<Date | undefined>(
    fallbackMonth,
  );
  const [inputValue, setInputValue] = useState(() => formatRange(initialRange));
  const [isSelectingEnd, setIsSelectingEnd] = useState(false);

  useEffect(() => {
    if (valueProp !== undefined) {
      const next = normalizeRange(valueProp);
      setSelectedRange(next);
      setCalendarMonth(next?.from ?? fallbackMonth);
      setInputValue(formatRange(next));
    }
  }, [valueProp]);

  useEffect(() => {
    if (open) {
      setIsSelectingEnd(false);
      if (selectedRange?.from && selectedRange.to) {
        setSelectedRange(undefined);
        setInputValue(formatValueForImask(""));
      }
    }
  }, [open]);

  const commitRange = (range: DateRange | undefined) => {
    const normalized = normalizeRange(range);
    setSelectedRange(normalized);
    setCalendarMonth(normalized?.from ?? fallbackMonth);
    setInputValue(formatRange(normalized));
    if (normalized?.from && isValidDate(normalized.from)) {
      onChange?.(normalized);
    }
  };

  const commitMaskedValue = (value: string) => {
    const digits = getDigits(value);
    const nextRange = getRangeFromDigits(digits);

    setInputValue(formatValueForImask(digits));
    setSelectedRange(nextRange);

    if (nextRange?.from) {
      setCalendarMonth(nextRange.from);
    }

    onChange?.(nextRange);
  };

  const fromValue = selectedRange?.from
    ? formatTimestamp({ date: selectedRange.from, template: "yyyy-MM-dd" })
    : "";
  const toValue = selectedRange?.to
    ? formatTimestamp({ date: selectedRange.to, template: "yyyy-MM-dd" })
    : "";

  return (
    <>
      {name && (
        <>
          <input type="hidden" name={`${name}From`} value={fromValue} />
          <input type="hidden" name={`${name}To`} value={toValue} />
        </>
      )}
      <InputGroup className={cn("mx-auto w-72", className)}>
        <IMaskInput
          id={name}
          mask="00/00/0000 - 00/00/0000"
          lazy={false}
          placeholderChar="_"
          value={inputValue}
          placeholder={placeholder}
          overwrite
          onAccept={(value) => commitMaskedValue(String(value))}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
            }
          }}
          className={cn(
            "h-9 min-w-0 flex-1 rounded-none border-0 bg-transparent px-2.5 py-1 text-base shadow-none outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:ring-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-0 md:text-sm dark:bg-transparent",
          )}
        />
        <InputGroupAddon align="inline-end">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <InputGroupButton
                variant="ghost"
                size="icon-xs"
                aria-label="Select date range"
              >
                <CalendarIcon />
                <span className="sr-only">Selecciona un rango de fechas</span>
              </InputGroupButton>
            </PopoverTrigger>
            <PopoverContent className="w-auto overflow-hidden p-0" align="end">
              <Calendar
                mode="range"
                locale={es}
                selected={selectedRange}
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                numberOfMonths={numberOfMonths}
                onSelect={(range) => {
                  commitRange(range);

                  if (!range?.from) {
                    setIsSelectingEnd(false);
                    return;
                  }

                  if (!range.to) {
                    setIsSelectingEnd(true);
                    return;
                  }

                  if (isSelectingEnd) {
                    setIsSelectingEnd(false);
                    setOpen(false);
                  } else {
                    setIsSelectingEnd(true);
                  }
                }}
              />
            </PopoverContent>
          </Popover>
        </InputGroupAddon>
      </InputGroup>
    </>
  );
}
