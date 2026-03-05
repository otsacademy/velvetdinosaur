# /edit Pages Index Redesign

## Stays the same
- Puck data schema and MongoDB storage.
- Existing routes: `/edit/[slug]`, `/preview/[slug]`, `/admin/theme`, live page routes.
- Existing actions/APIs for list/create/save/publish (no breaking changes).
- Status badges and draft/published timestamps remain visible.

## Changes
- Header actions: add prominent `New page` button + `Theme editor` link.
- Filters bar: client-side search + basic sort (no backend contract changes).
- Page list: enhanced cards with preview trigger and title/slug display.
- Preview: lazy-loaded side panel with iframe, draft/live tabs.
- New page flow: dialog with Title + Slug, creates page, then navigates to `/edit/[slug]`.

## Acceptance criteria
- /edit index shows search + sort, keeps Edit/Preview/View live actions.
- Preview opens on demand and defaults to draft; published/live view available when applicable.
- New page dialog creates a draft page and routes to editor.
- Theme editor action is visible in the header.
- No global styling/token changes; changes are scoped to `/edit` index.
