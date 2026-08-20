import type { EventRow, EventSortKey } from '@/components/edit/pages-index-types'

function parseEventTime(value?: string | null) {
  if (!value) return 0
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? 0 : time
}

function getEventStatusSortValue(eventItem: EventRow) {
  return eventItem.status === 'published' ? 1 : 0
}

export function filterAndSortEvents({
  events,
  query,
  sortKey,
}: {
  events: EventRow[]
  query: string
  sortKey: EventSortKey
}) {
  const filtered = query
    ? events.filter((eventItem) => {
        const slugMatch = eventItem.slug.toLowerCase().includes(query)
        const titleMatch = eventItem.title.toLowerCase().includes(query)
        const categoryMatch = eventItem.category.toLowerCase().includes(query)
        const organizerMatch = eventItem.organizer.toLowerCase().includes(query)
        return slugMatch || titleMatch || categoryMatch || organizerMatch
      })
    : events

  return [...filtered].sort((a, b) => {
    if (sortKey === 'title-asc') {
      return a.title.localeCompare(b.title)
    }

    if (sortKey === 'start-asc') {
      const aTime = parseEventTime(a.startDateTime)
      const bTime = parseEventTime(b.startDateTime)
      return aTime - bTime
    }

    if (sortKey === 'status-asc') {
      const statusDelta = getEventStatusSortValue(a) - getEventStatusSortValue(b)
      if (statusDelta !== 0) return statusDelta
    }

    const aTime = parseEventTime(a.updatedAt) || parseEventTime(a.startDateTime)
    const bTime = parseEventTime(b.updatedAt) || parseEventTime(b.startDateTime)
    return bTime - aTime
  })
}
