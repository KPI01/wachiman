import { parse } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { IMaskInput } from "react-imask";
import { Calendar } from "./calendar";
import { InputGroup, InputGroupAddon, InputGroupButton } from "./input-group";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn, formatTimestamp } from "~/lib/utils";

const DATE_DIGIT_SLOTS = [0, 1, 3, 4, 6, 7, 8, 9];

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
  return value.replace(/\D/g, "").slice(0, DATE_DIGIT_SLOTS.length);
}

function formatValueForImask(digits: string) {
  let result = "";
  let digitIndex = 0;
  const mask = "00/00/0000";

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
  if (digits.length < DATE_DIGIT_SLOTS.length) {
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

interface DatePickerProps {
  id?: string;
  name?: string;
  defaultValue?: Date | null;
  value?: Date | null;
  onChange?: (v: Date | undefined) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
}

export function DatePicker({
  id,
  name,
  defaultValue,
  value: valueProp,
  onChange,
  className,
  placeholder = "DD/MM/YYYY hh:mm",
  required,
  disabled,
  readOnly,
}: DatePickerProps) {
  const initialDate =
    valueProp !== undefined
      ? valueProp
        ? stripTime(valueProp)
        : undefined
      : defaultValue
        ? stripTime(defaultValue)
        : undefined;

  const fallbackMonth = initialDate ?? new Date();
  const inputId = id ?? name;

  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialDate,
  );
  const [calendarMonth, setCalendarMonth] = useState<Date | undefined>(
    fallbackMonth,
  );
  const [inputValue, setInputValue] = useState(() =>
    formatValueForImask(initialDate ? getDigitsFromDate(initialDate) : ""),
  );

  useEffect(() => {
    if (valueProp !== undefined) {
      const next = valueProp ? stripTime(valueProp) : undefined;
      setSelectedDate(next);
      setCalendarMonth(next ?? fallbackMonth);
      setInputValue(formatValueForImask(next ? getDigitsFromDate(next) : ""));
    }
  }, [valueProp]);

  useEffect(() => {
    if (!inputRef.current) {
      return;
    }

    if (required && !selectedDate) {
      inputRef.current.setCustomValidity("Selecciona una fecha.");
      return;
    }

    inputRef.current.setCustomValidity("");
  }, [required, selectedDate]);

  const commitDate = (date: Date | undefined) => {
    const nextDate = date && isValidDate(date) ? stripTime(date) : undefined;
    setSelectedDate(nextDate);
    setCalendarMonth(nextDate ?? fallbackMonth);
    setInputValue(
      formatValueForImask(nextDate ? getDigitsFromDate(nextDate) : ""),
    );
    onChange?.(nextDate);
  };

  const commitMaskedValue = (value: string) => {
    const digits = getDigits(value);
    const nextDate = getDateFromDigits(digits);

    setInputValue(formatValueForImask(digits));
    setSelectedDate(nextDate);

    if (nextDate) {
      setCalendarMonth(nextDate);
    }

    onChange?.(nextDate);
  };

  const hiddenValue = selectedDate
    ? formatTimestamp({ date: selectedDate, template: "yyyy-MM-dd" })
    : "";

  return (
    <>
      {name ? <input type="hidden" name={name} value={hiddenValue} /> : null}
      <InputGroup className={cn("mx-auto w-48", className)}>
        <IMaskInput
          inputRef={inputRef}
          id={inputId}
          mask="00/00/0000"
          lazy={false}
          placeholderChar="_"
          value={inputValue}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          overwrite
          onAccept={(value) => commitMaskedValue(String(value))}
          onKeyDown={(e) => {
            if (disabled || readOnly) {
              return;
            }

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
                aria-label="Select date"
                disabled={disabled || readOnly}
              >
                <CalendarIcon />
                <span className="sr-only">Selecciona una fecha</span>
              </InputGroupButton>
            </PopoverTrigger>
            <PopoverContent className="w-auto overflow-hidden p-0" align="end">
              <Calendar
                mode="single"
                locale={es}
                selected={selectedDate}
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                onSelect={(date) => {
                  commitDate(date);
                  setOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </InputGroupAddon>
      </InputGroup>
    </>
  );
}
