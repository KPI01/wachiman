import { CalendarIcon } from "lucide-react"
import { useState, useEffect } from "react"
import { parse } from "date-fns"
import { es } from "date-fns/locale"
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

interface DatePickerProps {
    label?: string
    name?: string
    defaultValue?: Date
    value?: Date
    onChange?: (v: Date) => void
    className?: string
}

export function DatePicker({ label, name, defaultValue, value: valueProp, onChange, className }: DatePickerProps) {
    const initialDate = valueProp !== undefined
        ? stripTime(valueProp)
        : defaultValue
            ? stripTime(defaultValue)
            : undefined

    const fallbackDate = initialDate ?? new Date(new Date().getFullYear(), 0, 1)

    const [open, setOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(fallbackDate)
    const [calendarMonth, setCalendarMonth] = useState<Date | undefined>(fallbackDate)
    const [inputValue, setInputValue] = useState(() => formatTimestamp({ date: fallbackDate }))

    useEffect(() => {
        if (valueProp !== undefined) {
            const next = stripTime(valueProp)
            setSelectedDate(next)
            setCalendarMonth(next)
            setInputValue(formatTimestamp({ date: next }))
        }
    }, [valueProp])

    const commitDate = (date: Date | undefined) => {
        setSelectedDate(date)
        setCalendarMonth(date)
        setInputValue(formatTimestamp({ date }))
        if (date && isValidDate(date)) {
            onChange?.(date)
        }
    }

    return (
        <Field className={cn("mx-auto w-48", className)}>
            {label && <FieldLabel htmlFor={name}>{label}</FieldLabel>}
            <InputGroup>
                <InputGroupInput
                    id={name}
                    name={name}
                    value={inputValue}
                    placeholder={formatTimestamp({ date: selectedDate })}
                    onChange={(e) => {
                        const val = e.target.value
                        setInputValue(val)
                        const parsed = parse(val, "dd/MM/yyyy", new Date(), { locale: es })
                        if (isValidDate(parsed)) {
                            setSelectedDate(parsed)
                            setCalendarMonth(parsed)
                            onChange?.(parsed)
                        }
                    }}
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
                                aria-label="Select date"
                            >
                                <CalendarIcon />
                                <span className="sr-only">Selecciona una fecha</span>
                            </InputGroupButton>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-auto overflow-hidden p-0"
                            align="end"
                        >
                            <Calendar
                                mode="single"
                                locale={es}
                                selected={selectedDate}
                                month={calendarMonth}
                                onMonthChange={setCalendarMonth}
                                onSelect={(date) => {
                                    commitDate(date)
                                    setOpen(false)
                                }}
                            />
                        </PopoverContent>
                    </Popover>
                </InputGroupAddon>
            </InputGroup>
        </Field>
    )
}
