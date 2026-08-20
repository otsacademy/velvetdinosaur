'use client'

import { EventDateTimeField } from '@/components/edit/event-editor/event-date-time-field'
import { EventEditorSectionShell } from '@/components/edit/event-editor/event-editor-section-shell'

type EventScheduleSectionProps = {
  startDateTime: string
  onStartDateTimeChange: (value: string) => void
  endDateTime: string
  onEndDateTimeChange: (value: string) => void
}

export function EventScheduleSection({
  startDateTime,
  onStartDateTimeChange,
  endDateTime,
  onEndDateTimeChange,
}: EventScheduleSectionProps) {
  return (
    <EventEditorSectionShell
      value="schedule"
      title="Date & time"
      description="Set when the event starts and ends."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <EventDateTimeField id="event-start" label="Start date/time" value={startDateTime} onChange={onStartDateTimeChange} />
        <EventDateTimeField id="event-end" label="End date/time" value={endDateTime} onChange={onEndDateTimeChange} />
      </div>
    </EventEditorSectionShell>
  )
}
