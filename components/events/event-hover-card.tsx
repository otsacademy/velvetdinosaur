'use client'

import Image from 'next/image'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'

import { EventChapterBadge } from '@/components/events/event-chapter-badge'
import {
  eventRegistrationExternal,
  eventRegistrationHref,
  eventRegistrationLabel,
  hasEventRegistration,
  type ASAPEvent
} from '@/lib/events'

export function EventHoverCard({ eventItem }: { eventItem: ASAPEvent }) {
  const parsedDate = (() => {
    const primary = parseISO(eventItem.date || eventItem.startDateTime)
    if (!Number.isNaN(primary.getTime())) return primary
    const fallback = new Date(eventItem.startDateTime)
    return Number.isNaN(fallback.getTime()) ? new Date() : fallback
  })()

  return (
    <div className="w-72 overflow-hidden rounded-lg border border-border bg-card shadow-xl">
      <div className="relative h-40 w-full">
        <Image src={eventItem.img} alt={eventItem.title} fill className="object-cover" />
      </div>
      <div className="p-4">
        <p className="text-xs text-muted-foreground">
          {format(parsedDate, 'MMMM d')} @ {eventItem.startTime} - {eventItem.endTime}
        </p>
        {eventItem.primaryChapterName ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <EventChapterBadge chapterName={eventItem.primaryChapterName} />
          </div>
        ) : null}
        <h4 className="mt-1 font-serif text-base font-bold leading-snug text-card-foreground">{eventItem.title}</h4>
        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{eventItem.description}</p>
        <div className="mt-3 flex items-center gap-3">
          {hasEventRegistration(eventItem) ? (
            <Link
              href={eventRegistrationHref(eventItem)}
              target={eventRegistrationExternal(eventItem) ? '_blank' : undefined}
              rel={eventRegistrationExternal(eventItem) ? 'noreferrer' : undefined}
              className="text-xs font-medium text-accent underline underline-offset-2"
            >
              {eventRegistrationLabel(eventItem)}
            </Link>
          ) : (
            <span className="text-xs font-medium text-muted-foreground">Details</span>
          )}
          <span className="text-xs text-muted-foreground">{eventItem.cost}</span>
        </div>
      </div>
    </div>
  )
}
