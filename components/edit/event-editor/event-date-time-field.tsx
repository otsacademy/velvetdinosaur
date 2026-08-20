'use client'

import { useMemo } from 'react'
import { format } from 'date-fns'
import { CalendarDays, Clock3, X } from 'lucide-react'

import { mergeDateAndTime, parseDateTimeInput, toDateTimeInput, toTimeInputValue } from '@/components/edit/event-editor.shared'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type EventDateTimeFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  description?: string
  placeholder?: string
  clearable?: boolean
}

export function EventDateTimeField({
  id,
  label,
  value,
  onChange,
  disabled = false,
  description,
  placeholder = 'Pick date and time',
  clearable = false,
}: EventDateTimeFieldProps) {
  const selectedDate = useMemo(() => parseDateTimeInput(value), [value])
  const timeValue = useMemo(() => toTimeInputValue(selectedDate), [selectedDate])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {clearable && value ? (
          <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onChange('')} disabled={disabled}>
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        ) : null}
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className="h-auto min-h-11 w-full justify-between px-3 py-2 text-left font-normal"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm text-foreground">
                {selectedDate ? format(selectedDate, "MMMM d, yyyy 'at' h:mm a") : placeholder}
              </span>
              <span className="block text-xs text-muted-foreground">
                {selectedDate ? 'Click to edit date or time' : 'Choose a date, then set the time'}
              </span>
            </span>
            <CalendarDays className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[20rem] space-y-4">
          <Calendar
            mode="single"
            selected={selectedDate || undefined}
            onSelect={(date) => {
              if (!date) {
                if (clearable) onChange('')
                return
              }
              onChange(toDateTimeInput(mergeDateAndTime(date, timeValue)))
            }}
            initialFocus
          />
          <div className="space-y-2">
            <Label htmlFor={`${id}-time`} className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <Clock3 className="h-3.5 w-3.5" />
              Time
            </Label>
            <Input
              id={`${id}-time`}
              type="time"
              value={timeValue}
              disabled={disabled || !selectedDate}
              onChange={(event) => {
                const baseDate = selectedDate || new Date()
                onChange(toDateTimeInput(mergeDateAndTime(baseDate, event.target.value)))
              }}
            />
          </div>
        </PopoverContent>
      </Popover>

      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
    </div>
  )
}
