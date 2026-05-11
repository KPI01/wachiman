import { CalendarIcon } from "lucide-react"
import { useState, useEffect } from "react"
import { es } from "date-fns/locale"
import type { DateRange } from "react-day-picker"
import { Calendar } from "./calendar"
import { Field, FieldLabel } from "./field"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "./input-group"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { formatTimestamp, cn } from "~/lib/utils"

function isValidDate(date: Date | undefined) {
    if (!date) {
        return false
    }
    return !isNaN(date.getTime())
}

function stripTime(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function normalizeRange(range: DateRange | undefined): DateRange | undefined {
    if (!range || !range.from) {
        return undefined
    }
    return {
        from: stripTime(range.from),
        to: range.to ? stripTime(range.to) : undefined,
    }
}

function formatRange(range: DateRange | undefined): string {
    if (!range?.from) {
        return ""
    }
    const from = formatTimestamp({ date: range.from })
    if (!range.to) {
        return from
    }
    const to = formatTimestamp({ date: range.to })
    return `${from} - ${to}`
}

interface DateRangePickerProps {
    label?: string
    name?: string
    defaultValue?: DateRange
    value?: DateRange
    onChange?: (range: DateRange | undefined) => void
    className?: string
    placeholder?: string
    numberOfMonths?: number
}

export function DateRangePicker({
    label,
    name,
    defaultValue,
    value: valueProp,
    onChange,
    className,
    placeholder,
    numberOfMonths = 2,
}: DateRangePickerProps) {
    const initialRange = normalizeRange(
        valueProp !== undefined ? valueProp : defaultValue
    )
    const fallbackMonth = initialRange?.from ?? new Date(new Date().getFullYear(), 0, 1)

    const [open, setOpen] = useState(false)
    const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(initialRange)
    const [calendarMonth, setCalendarMonth] = useState<Date | undefined>(fallbackMonth)
    const [inputValue, setInputValue] = useState(() => formatRange(initialRange))
    const [isSelectingEnd, setIsSelectingEnd] = useState(false)

    useEffect(() => {
        if (valueProp !== undefined) {
            const next = normalizeRange(valueProp)
            setSelectedRange(next)
            setCalendarMonth(next?.from ?? fallbackMonth)
            setInputValue(formatRange(next))
        }
    }, [valueProp])

    useEffect(() => {
        if (open) {
            setIsSelectingEnd(false)
            if (selectedRange?.from && selectedRange.to) {
                setSelectedRange(undefined)
                setInputValue("")
            }
        }
    }, [open])

    const commitRange = (range: DateRange | undefined) => {
        const normalized = normalizeRange(range)
        setSelectedRange(normalized)
        setCalendarMonth(normalized?.from ?? fallbackMonth)
        setInputValue(formatRange(normalized))
        if (normalized?.from && isValidDate(normalized.from)) {
            onChange?.(normalized)
        }
    }

    const fromValue = selectedRange?.from
        ? formatTimestamp({ date: selectedRange.from, template: "yyyy-MM-dd" })
        : ""
    const toValue = selectedRange?.to
        ? formatTimestamp({ date: selectedRange.to, template: "yyyy-MM-dd" })
        : ""

    return (
        <Field className={cn("mx-auto w-72", className)}>
            {label && <FieldLabel htmlFor={name}>{label}</FieldLabel>}
            {name && (
                <>
                    <input type="hidden" name={`${name}From`} value={fromValue} />
                    <input type="hidden" name={`${name}To`} value={toValue} />
                </>
            )}
            <InputGroup>
                <InputGroupInput
                    id={name}
                    value={inputValue}
                    placeholder={placeholder ?? "Selecciona un rango"}
                    readOnly
                    onKeyDown={(e) => {
                        if (e.key === "ArrowDown") {
                            e.preventDefault()
                            setOpen(true)
                        }
                    }}
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
                        <PopoverContent
                            className="w-auto overflow-hidden p-0"
                            align="end"
                        >
                            <Calendar
                                mode="range"
                                locale={es}
                                selected={selectedRange}
                                month={calendarMonth}
                                onMonthChange={setCalendarMonth}
                                numberOfMonths={numberOfMonths}
                                onSelect={(range) => {
                                    commitRange(range)

                                    if (!range?.from) {
                                        setIsSelectingEnd(false)
                                        return
                                    }

                                    if (!range.to) {
                                        setIsSelectingEnd(true)
                                        return
                                    }

                                    if (isSelectingEnd) {
                                        setIsSelectingEnd(false)
                                        setOpen(false)
                                    } else {
                                        setIsSelectingEnd(true)
                                    }
                                }}
                            />
                        </PopoverContent>
                    </Popover>
                </InputGroupAddon>
            </InputGroup>
        </Field>
    )
}
