'use client'

import { EventEditorSectionShell } from '@/components/edit/event-editor/event-editor-section-shell'
import { locationTypeLabel } from '@/components/edit/event-editor.shared'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EVENT_LOCATION_TYPES, type EventLocationType } from '@/lib/events'

type EventLocationSectionProps = {
  locationType: EventLocationType
  onLocationTypeChange: (value: EventLocationType) => void
  venueName: string
  onVenueNameChange: (value: string) => void
  venueAddress: string
  onVenueAddressChange: (value: string) => void
}

export function EventLocationSection({
  locationType,
  onLocationTypeChange,
  venueName,
  onVenueNameChange,
  venueAddress,
  onVenueAddressChange,
}: EventLocationSectionProps) {
  const venueLabel = locationType === 'virtual' ? 'Platform / room name' : 'Venue name'
  const venuePlaceholder = locationType === 'virtual' ? 'Zoom webinar, Google Meet, Teams room' : 'Venue name'

  return (
    <EventEditorSectionShell
      value="location"
      title="Location"
      description="Choose in-person, virtual, or hybrid details."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Location type</Label>
          <Select value={locationType} onValueChange={(value) => onLocationTypeChange(value as EventLocationType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_LOCATION_TYPES.map((entry) => (
                <SelectItem key={entry} value={entry}>
                  {locationTypeLabel(entry)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="event-venue">{venueLabel}</Label>
          <Input
            id="event-venue"
            value={venueName}
            onChange={(event) => onVenueNameChange(event.target.value)}
            placeholder={venuePlaceholder}
          />
        </div>

        {locationType !== 'virtual' ? (
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="event-address">Venue address / location</Label>
            <Input
              id="event-address"
              value={venueAddress}
              onChange={(event) => onVenueAddressChange(event.target.value)}
              placeholder={locationType === 'hybrid' ? 'City, country or in-person venue details' : 'City, country or full address'}
            />
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border/70 bg-muted/15 px-3 py-3 text-sm text-muted-foreground md:col-span-2">
            Virtual events only need the platform name here. Joining links still belong in the registration section so
            they can be sent later by email.
          </div>
        )}
      </div>
    </EventEditorSectionShell>
  )
}
