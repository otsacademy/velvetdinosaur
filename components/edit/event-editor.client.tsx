'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Loader2, Save, Send, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { EventChaptersSection } from '@/components/edit/event-editor/event-chapters-section'
import { EventDetailsSection } from '@/components/edit/event-editor/event-details-section'
import { EventLocationSection } from '@/components/edit/event-editor/event-location-section'
import { EventRegistrationSection } from '@/components/edit/event-editor/event-registration-section'
import { EventScheduleSection } from '@/components/edit/event-editor/event-schedule-section'
import { normalizeInitialHeroImage, normalizeTagsInput, toDateTimeInput } from '@/components/edit/event-editor.shared'
import { normalizeChapterSlug, normalizeChapterSlugs } from '@/lib/chapters'
import { Accordion } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  type ASAPEvent,
  type EventLocationType,
  type EventRegistrationMode,
  type EventStatus,
} from '@/lib/events'
import { slugifyArticleTitle } from '@/lib/news-slug'

type EventEditorProps = {
  returnPath?: string
  initialEvent?: ASAPEvent | null
  isDuplicate?: boolean
  activeProfile?: {
    primaryChapterSlug?: string
    chapterSlugs?: string[]
  } | null
}

export function EventEditor({
  returnPath = '/edit?tab=events',
  initialEvent = null,
  isDuplicate = false,
  activeProfile = null,
}: EventEditorProps) {
  const isEditing = Boolean(initialEvent) && !isDuplicate
  const originalSlug = isEditing ? initialEvent?.slug || '' : ''

  const [title, setTitle] = useState(initialEvent?.title || 'Untitled event')
  const [slug, setSlug] = useState(isDuplicate ? '' : initialEvent?.slug || '')
  const [slugDirty, setSlugDirty] = useState(Boolean(initialEvent?.slug) && !isDuplicate)
  const [startDateTime, setStartDateTime] = useState(() => toDateTimeInput(initialEvent?.startDateTime))
  const [endDateTime, setEndDateTime] = useState(() => toDateTimeInput(initialEvent?.endDateTime))
  const [locationType, setLocationType] = useState<EventLocationType>(
    initialEvent?.isVirtual ? 'virtual' : initialEvent?.isHybrid ? 'hybrid' : 'in-person',
  )
  const [venueName, setVenueName] = useState(initialEvent?.venue || '')
  const [venueAddress, setVenueAddress] = useState(
    initialEvent?.isVirtual ? '' : (initialEvent?.location || '').replace(/^Hybrid\s*\/\s*/i, ''),
  )
  const [category, setCategory] = useState<string>(initialEvent?.category || 'Conference')
  const [description, setDescription] = useState(initialEvent?.fullDescription || initialEvent?.description || '')
  const [heroImage, setHeroImage] = useState(() => normalizeInitialHeroImage(initialEvent?.img))
  const [registrationMode, setRegistrationMode] = useState<EventRegistrationMode>(
    initialEvent?.registrationMode || (initialEvent?.ticketUrl ? 'external' : 'none'),
  )
  const [ticketUrl, setTicketUrl] = useState(initialEvent?.ticketUrl || '')
  const [registrationOpensAt, setRegistrationOpensAt] = useState(() => toDateTimeInput(initialEvent?.registrationOpensAt))
  const [registrationClosesAt, setRegistrationClosesAt] = useState(() => toDateTimeInput(initialEvent?.registrationClosesAt))
  const [joiningInstructions, setJoiningInstructions] = useState(initialEvent?.joiningInstructions || '')
  const [isFree, setIsFree] = useState(() => (initialEvent?.cost || '').toLowerCase() === 'free')
  const [ticketPrice, setTicketPrice] = useState(() =>
    (initialEvent?.cost || '').toLowerCase() === 'free' ? '' : initialEvent?.cost || '',
  )
  const [organizer, setOrganizer] = useState(initialEvent?.organizer || process.env.NEXT_PUBLIC_SITE_NAME || '')
  const [primaryChapterSlug, setPrimaryChapterSlug] = useState(() =>
    normalizeChapterSlug(initialEvent?.primaryChapterSlug || activeProfile?.primaryChapterSlug),
  )
  const [chapterSlugs, setChapterSlugs] = useState<string[]>(() =>
    normalizeChapterSlugs(
      initialEvent?.chapterSlugs || activeProfile?.chapterSlugs,
      initialEvent?.primaryChapterSlug || activeProfile?.primaryChapterSlug,
    ),
  )
  const [tagsInput, setTagsInput] = useState(normalizeTagsInput(initialEvent?.tags || []))
  const [status, setStatus] = useState<EventStatus>(isDuplicate ? 'draft' : initialEvent?.status || 'draft')
  const [featured, setFeatured] = useState(initialEvent?.featured === true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(isEditing ? new Date() : null)

  useEffect(() => {
    if (slugDirty) return
    setSlug(slugifyArticleTitle(title))
  }, [slugDirty, title])

  useEffect(() => {
    if (!activeProfile) return
    if (primaryChapterSlug || chapterSlugs.length > 0) return

    const nextPrimaryChapterSlug = normalizeChapterSlug(activeProfile.primaryChapterSlug)
    const nextChapterSlugs = normalizeChapterSlugs(activeProfile.chapterSlugs, nextPrimaryChapterSlug)
    if (!nextPrimaryChapterSlug && nextChapterSlugs.length === 0) return

    setPrimaryChapterSlug(nextPrimaryChapterSlug)
    setChapterSlugs(nextChapterSlugs)
  }, [activeProfile, chapterSlugs.length, primaryChapterSlug])

  const normalizedTicketPrice = useMemo(() => {
    if (isFree) return ''
    return ticketPrice.trim()
  }, [isFree, ticketPrice])

  const eventPreviewHref = slug ? `/events/${slug}` : ''

  async function save(nextStatus: EventStatus) {
    if (isSubmitting) return

    if (!title.trim()) {
      toast.error('Title is required')
      return
    }

    if (!slug.trim()) {
      toast.error('Slug is required')
      return
    }

    if (!startDateTime || !endDateTime) {
      toast.error('Start and end date/time are required')
      return
    }

    if (!description.trim()) {
      toast.error('Description is required')
      return
    }

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      originalSlug,
      startDateTime,
      endDateTime,
      locationType,
      venueName: venueName.trim(),
      venueAddress: venueAddress.trim(),
      category,
      description: description.trim(),
      heroImage: heroImage.trim(),
      registrationMode,
      ticketUrl: ticketUrl.trim(),
      registrationOpensAt,
      registrationClosesAt,
      joiningInstructions: joiningInstructions.trim(),
      ticketPrice: normalizedTicketPrice,
      isFree,
      organizer: organizer.trim(),
      primaryChapterSlug,
      chapterSlugs,
      tags: tagsInput,
      status: nextStatus,
      featured,
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = (await response.json().catch(() => ({}))) as { error?: string; slug?: string }
      if (!response.ok) {
        throw new Error(result.error || 'Unable to save event')
      }

      const wasPublished = status === 'published'
      setStatus(nextStatus)
      setLastSavedAt(new Date())
      toast.success(nextStatus === 'published' ? (wasPublished ? 'Saved' : 'Event published') : 'Saved')

      if (!isEditing && result.slug) {
        window.location.assign(`/edit/events/new?slug=${encodeURIComponent(result.slug)}`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save event')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function deleteEvent() {
    if (!isEditing || !originalSlug) return

    const confirmed = window.confirm(`Delete "${title}"? This cannot be undone.`)
    if (!confirmed) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/events/${encodeURIComponent(originalSlug)}`, {
        method: 'DELETE',
      })

      const result = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) {
        throw new Error(result.error || 'Unable to delete event')
      }

      toast.success('Event deleted')
      window.location.assign(returnPath)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete event')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--vd-muted)]/15 pb-12">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 lg:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <Button variant="ghost" asChild className="-ml-3 w-fit">
              <Link href={returnPath}>
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
              </Link>
            </Button>
            <h1 className="text-3xl font-black tracking-tight text-[var(--vd-fg)]">
              {isEditing ? 'Edit event' : 'New event'}
            </h1>
            <p className="text-sm text-[var(--vd-muted-fg)]">
              Draft events stay internal. Published events appear automatically on the public `/events` page.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {eventPreviewHref ? (
              <Button variant="outline" asChild>
                <Link href={eventPreviewHref} target="_blank" rel="noreferrer">
                  Preview
                </Link>
              </Button>
            ) : null}
            <Button variant="outline" disabled={isSubmitting} onClick={() => save(status)}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
            {status !== 'published' ? (
              <Button disabled={isSubmitting} onClick={() => save('published')}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Publish
              </Button>
            ) : null}
          </div>
        </div>

        <Card className="p-6">
          <Accordion
            type="multiple"
            className="space-y-4"
            defaultValue={['details', 'schedule', 'registration']}
          >
            <EventDetailsSection
              title={title}
              onTitleChange={setTitle}
              slug={slug}
              onSlugChange={(value) => {
                setSlugDirty(true)
                setSlug(slugifyArticleTitle(value))
              }}
              onSlugUnlock={() => setSlugDirty(true)}
              category={category}
              onCategoryChange={setCategory}
              organizer={organizer}
              onOrganizerChange={setOrganizer}
              description={description}
              onDescriptionChange={setDescription}
              heroImage={heroImage}
              onHeroImageChange={setHeroImage}
              tagsInput={tagsInput}
              onTagsInputChange={setTagsInput}
              featured={featured}
              onFeaturedChange={setFeatured}
              status={status}
              onStatusChange={setStatus}
            />

            <EventScheduleSection
              startDateTime={startDateTime}
              onStartDateTimeChange={setStartDateTime}
              endDateTime={endDateTime}
              onEndDateTimeChange={setEndDateTime}
            />

            <EventLocationSection
              locationType={locationType}
              onLocationTypeChange={setLocationType}
              venueName={venueName}
              onVenueNameChange={setVenueName}
              venueAddress={venueAddress}
              onVenueAddressChange={setVenueAddress}
            />

            <EventRegistrationSection
              registrationMode={registrationMode}
              onRegistrationModeChange={setRegistrationMode}
              ticketUrl={ticketUrl}
              onTicketUrlChange={setTicketUrl}
              isFree={isFree}
              onIsFreeChange={setIsFree}
              ticketPrice={ticketPrice}
              onTicketPriceChange={setTicketPrice}
              registrationOpensAt={registrationOpensAt}
              onRegistrationOpensAtChange={setRegistrationOpensAt}
              registrationClosesAt={registrationClosesAt}
              onRegistrationClosesAtChange={setRegistrationClosesAt}
              joiningInstructions={joiningInstructions}
              onJoiningInstructionsChange={setJoiningInstructions}
            />

            <EventChaptersSection
              primaryChapterSlug={primaryChapterSlug}
              onPrimaryChapterChange={(nextValue) => {
                setPrimaryChapterSlug(nextValue)
                setChapterSlugs((current) => normalizeChapterSlugs(current, nextValue))
              }}
              chapterSlugs={chapterSlugs}
              onChapterToggle={(chapterSlug, checked) => {
                setChapterSlugs((current) => {
                  const next = checked
                    ? [...current, chapterSlug]
                    : current.filter((entry) => entry !== chapterSlug)
                  return normalizeChapterSlugs(next, primaryChapterSlug)
                })
              }}
            />
          </Accordion>
        </Card>

        <Card className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm text-[var(--vd-muted-fg)]">
          <div>
            {lastSavedAt ? `Last saved ${lastSavedAt.toLocaleString()}` : 'Not saved yet'}
            {slug ? ` • URL /events/${slug}` : ''}
          </div>
          {isEditing ? (
            <Button variant="destructive" onClick={deleteEvent} disabled={isDeleting || isSubmitting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete event
            </Button>
          ) : null}
        </Card>
      </div>
    </main>
  )
}
