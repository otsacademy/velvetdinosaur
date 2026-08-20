'use client'

import { EventDateTimeField } from '@/components/edit/event-editor/event-date-time-field'
import { EventEditorSectionShell } from '@/components/edit/event-editor/event-editor-section-shell'
import { registrationModeLabel } from '@/components/edit/event-editor.shared'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { EVENT_REGISTRATION_MODES, type EventRegistrationMode } from '@/lib/events'

type EventRegistrationSectionProps = {
  registrationMode: EventRegistrationMode
  onRegistrationModeChange: (value: EventRegistrationMode) => void
  ticketUrl: string
  onTicketUrlChange: (value: string) => void
  isFree: boolean
  onIsFreeChange: (value: boolean) => void
  ticketPrice: string
  onTicketPriceChange: (value: string) => void
  registrationOpensAt: string
  onRegistrationOpensAtChange: (value: string) => void
  registrationClosesAt: string
  onRegistrationClosesAtChange: (value: string) => void
  joiningInstructions: string
  onJoiningInstructionsChange: (value: string) => void
}

export function EventRegistrationSection({
  registrationMode,
  onRegistrationModeChange,
  ticketUrl,
  onTicketUrlChange,
  isFree,
  onIsFreeChange,
  ticketPrice,
  onTicketPriceChange,
  registrationOpensAt,
  onRegistrationOpensAtChange,
  registrationClosesAt,
  onRegistrationClosesAtChange,
  joiningInstructions,
  onJoiningInstructionsChange,
}: EventRegistrationSectionProps) {
  return (
    <EventEditorSectionShell
      value="registration"
      title="Registration & tickets"
      description="Choose no registration, an external link, or built-in RSVP."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Registration mode</Label>
          <Select value={registrationMode} onValueChange={(value) => onRegistrationModeChange(value as EventRegistrationMode)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_REGISTRATION_MODES.map((entry) => (
                <SelectItem key={entry} value={entry}>
                  {registrationModeLabel(entry)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <Label htmlFor="event-free">Free event</Label>
          <Switch id="event-free" checked={isFree} onCheckedChange={onIsFreeChange} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="event-ticket-price">Ticket price</Label>
          <Input
            id="event-ticket-price"
            value={ticketPrice}
            onChange={(event) => onTicketPriceChange(event.target.value)}
            disabled={isFree}
            placeholder={isFree ? 'Free' : '$25.00'}
          />
        </div>

        {registrationMode === 'external' ? (
          <div className="space-y-2">
            <Label htmlFor="event-ticket-url">Ticket URL</Label>
            <Input
              id="event-ticket-url"
              value={ticketUrl}
              onChange={(event) => onTicketUrlChange(event.target.value)}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground">Visitors will be sent directly to this external registration page.</p>
          </div>
        ) : null}

        {registrationMode === 'local' ? (
          <>
            <EventDateTimeField
              id="event-registration-opens"
              label="Registration opens"
              value={registrationOpensAt}
              onChange={onRegistrationOpensAtChange}
              clearable
              description="Optional. Leave blank to open registration immediately."
            />

            <EventDateTimeField
              id="event-registration-closes"
              label="Registration closes"
              value={registrationClosesAt}
              onChange={onRegistrationClosesAtChange}
              clearable
              description="Optional. Leave blank to keep registration open until the event ends."
            />

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="event-joining-instructions">Joining instructions</Label>
              <Textarea
                id="event-joining-instructions"
                value={joiningInstructions}
                onChange={(event) => onJoiningInstructionsChange(event.target.value)}
                placeholder="Paste the Zoom, Google Meet, or webinar link here for the final joining-instructions email."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Used for the final event email to confirmed local registrants. Leave blank until you have the final link.
              </p>
            </div>
          </>
        ) : null}

        {registrationMode === 'none' ? (
          <div className="rounded-md border border-dashed border-border/70 bg-muted/15 px-3 py-3 text-sm text-muted-foreground md:col-span-2">
            This event will show details only. Visitors will not see a registration button.
          </div>
        ) : null}
      </div>
    </EventEditorSectionShell>
  )
}
