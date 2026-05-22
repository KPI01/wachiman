import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { IMaskInput } from "react-imask";
import { Calendar } from "./calendar";
import { InputGroup, InputGroupAddon, InputGroupButton } from "./input-group";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn, formatTimestamp } from "~/lib/utils";

const DIGIT_SLOTS = [0, 1, 3, 4, 6, 7, 8, 9, 11, 12, 14, 15];

function getDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, DIGIT_SLOTS.length);
}

function formatValueForImask(digits: string) {
  let result = "";
  let digitIndex = 0;
  const mask = "00/00/0000 00:00";

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

function getDigitsFromDate(date: Date, includeTime = true) {
  return formatTimestamp({
    date,
    template: includeTime ? "ddMMyyyyHHmm" : "ddMMyyyy",
  });
}

function stripTime(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getDateFromDigits(digits: string) {
  if (digits.length < 8) {
    return undefined;
  }

  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));
  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return undefined;
  }

  return parsed;
}

function getTimeFromDigits(digits: string) {
  if (digits.length < 12) {
    return "";
  }

  const hours = Number(digits.slice(8, 10));
  const minutes = Number(digits.slice(10, 12));

  if (hours > 23 || minutes > 59) {
    return "";
  }

  return `${digits.slice(8, 10)}:${digits.slice(10, 12)}`;
}

function mergeDateAndTime(date: Date | undefined, time: string) {
  if (!date) {
    return undefined;
  }

  if (!time) {
    return stripTime(date);
  }

  const [hours, minutes] = time.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return stripTime(date);
  }

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
  );
}

interface DateTimePickerProps {
  id?: string;
  name?: string;
  defaultValue?: Date | null;
  value?: Date | null;
  onChange?: (value: Date | undefined) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
}

export function DateTimePicker({
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
}: DateTimePickerProps) {
  const initialDateTime =
    valueProp !== undefined
      ? (valueProp ?? undefined)
      : (defaultValue ?? undefined);
  const initialDate = initialDateTime ? stripTime(initialDateTime) : undefined;
  const initialDigits = initialDateTime
    ? getDigitsFromDate(initialDateTime)
    : "";
  const initialTime = getTimeFromDigits(initialDigits);
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
    formatValueForImask(initialDigits),
  );
  const [timeValue, setTimeValue] = useState(initialTime);

  useEffect(() => {
    if (valueProp === undefined) {
      return;
    }

    const nextDateTime = valueProp ?? undefined;
    const nextDate = nextDateTime ? stripTime(nextDateTime) : undefined;
    const nextDigits = nextDateTime ? getDigitsFromDate(nextDateTime) : "";

    setSelectedDate(nextDate);
    setCalendarMonth(nextDate ?? fallbackMonth);
    setInputValue(formatValueForImask(nextDigits));
    setTimeValue(getTimeFromDigits(nextDigits));
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

  const notifyChange = (digits: string) => {
    const nextDate = getDateFromDigits(digits);
    const nextTime = getTimeFromDigits(digits);

    onChange?.(mergeDateAndTime(nextDate, nextTime));
  };

  const commitMaskedValue = (value: string) => {
    const digits = getDigits(value);
    const nextDate = getDateFromDigits(digits);
    const nextTime = getTimeFromDigits(digits);

    setInputValue(formatValueForImask(digits));
    setSelectedDate(nextDate);
    setTimeValue(nextTime);

    if (nextDate) {
      setCalendarMonth(nextDate);
    }

    notifyChange(digits);
  };

  const setDateFromCalendar = (date: Date | undefined) => {
    const nextDate = date ? stripTime(date) : undefined;
    const currentTimeDigits = getDigits(inputValue).slice(8, 12);
    const nextDigits = nextDate
      ? `${getDigitsFromDate(nextDate, false)}${currentTimeDigits}`
      : "";
    const nextTime = getTimeFromDigits(nextDigits);

    setSelectedDate(nextDate);
    setCalendarMonth(nextDate ?? fallbackMonth);
    setInputValue(formatValueForImask(nextDigits));
    setTimeValue(nextTime);
    notifyChange(nextDigits);
  };

  const selectedDateValue = formatTimestamp({
    date: selectedDate,
    template: "yyyy-MM-dd",
  });
  const hiddenValue = selectedDate
    ? `${selectedDateValue}T${timeValue || "00:00"}`
    : "";
  const requiresDate = required || Boolean(timeValue);

  return (
    <>
      {name ? <input type="hidden" name={name} value={hiddenValue} /> : null}
      <InputGroup className={cn("mx-auto w-72", className)}>
        <IMaskInput
          inputRef={inputRef}
          id={inputId}
          mask="00/00/0000 00:00"
          lazy={false}
          placeholderChar="_"
          value={inputValue}
          placeholder={placeholder}
          required={requiresDate}
          disabled={disabled}
          readOnly={readOnly}
          overwrite
          onAccept={(value) => commitMaskedValue(String(value))}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
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
                aria-label="Selecciona la fecha y hora"
                disabled={disabled || readOnly}
              >
                <CalendarIcon />
                <span className="sr-only">Selecciona fecha y hora</span>
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
                  setDateFromCalendar(date);
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
