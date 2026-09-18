# Newsletter images and attachments

Date: 2026-09-18
Status: Revised after audit and independent verification; implementation in progress.
Source: User request to upload or select newsletter images through the existing Media Library, and attach PDFs across Velvet Dinosaur, ASAP, The Brave and the demo fleet.

## Outcome

An editor can insert an image into a newsletter or attach a PDF without editing HTML or copying a URL. Both actions offer **Upload** and **Media Library**. Uploads become normal assets in that site's existing Media Library and can be reused elsewhere. Selecting an existing asset does not create another library entry.

## Verified starting point

- The local inventory discovers 48 installed demo sites. All 48 contain the Media Library, Puck asset picker and newsletter composer. Velvet Dinosaur, ASAP and The Brave also contain them. This confirms source availability, not a completed live upload test on every site.
- Puck's `components/puck/fields/asset-picker-field.tsx` already supports upload, library search, folders and metadata through `lib/uploads.ts` and `/api/assets/*`.
- The newsletter uses a separate Plate visual editor. Its plugin set and HTML serializer have no image support. The campaign schema has no user attachment field.
- `lib/uploads.ts` builds relative asset URLs. Email output must resolve these against the sending site's configured public origin.
- The image pipeline normally generates WebP assets. The existing JPEG social variant is cropped, so it must not be reused blindly for newsletter images.
- Asset usage currently tracks pages and articles, not newsletter campaigns. Media Library replacement preserves URLs, which requires explicit handling for scheduled and previously sent newsletters.
- The public demonstration newsletter has a separate editor and simulated sending. It is distinct from the 48 installed demo websites.
- The editor sync manifest at `/opt/vdplatform/sync/editor-baseline.json` uses `template` as its source. It includes editor components but does not currently cover the complete newsletter backend and model; syncing UI alone would leave this feature incomplete.

## User experience

| Action | Behaviour |
| --- | --- |
| Insert image | Toolbar button opens an image picker with Upload and Media Library choices. |
| Upload image | Reuses the existing upload pipeline, shows progress, adds the asset to the library, then inserts it at the saved cursor position. |
| Choose image | Search or browse all permitted folders, preview the selected image, then insert it. |
| Edit image | Change alt text, optional caption/link, alignment and display width; replace or remove it. Changes to newsletter alt text/caption stay local to that image occurrence. |
| Attach file | Opens the same picker pattern, filtered to supported attachments. PDF is the primary case; JPEG/PNG attachments also address the original request. |
| Review attachments | Show filename, type and size, with preview/download and Remove. Removing an attachment does not delete the library asset. |
| Preview and send | Preview includes the inline images and attachment list. Test and scheduled deliveries use the same preparation path. |

## Proposed defaults

- Use the site's existing storage and MongoDB asset records. Default new uploads to a `newsletters` folder; allow browsing the whole permitted library.
- Display images using immutable public HTTPS URLs, with the existing {{appUrl}} token, and uncropped JPEG/PNG renditions at at most 1120px for the 560px column. Durable site-owned rendition records survive deletion of the original asset; private attachment snapshots are never publicly served. Generate lazily for assets with trusted ownership provenance; migrate legacy records from reviewed evidence or request reupload.
- Keep inline images separate from downloadable attachments. Initial image presentation is static; animated-image support is a later enhancement.
- Store image asset references and presentation fields in the visual document; store attachment references on the campaign. Never put file bytes or base64 in the campaign document.
- Attachment limit: five files and 5 MiB combined decoded attachment bytes. Independently validate the fully prepared message, including encoding and existing inline social icons, against the provider limit.
- Keep scheduled deliveries consistent: freeze subject, preheader, bodies, selected image renditions and attachment bytes before queueing. A library replacement must not alter an already queued campaign.
- Existing campaigns default to no attachments and continue to render as before.
- The public walkthrough uses its existing session-scoped demo asset store and simulated sending. Installed demo websites use their site-owned asset records; real newsletter sending is disabled by default and requires explicit server configuration. Admin authorization still applies.

Postmark supports attachments and inline images. Its maximum outbound message size is 10 MB after encoding, including attachments. These are provider constraints; the smaller proposed product limits above are implementation defaults. [Attachment API](https://postmarkapp.com/developer/user-guide/send-email-with-api/send-a-single-email), [message size limits](https://postmarkapp.com/support/article/1056-what-are-the-attachment-and-email-size-limits).

## Success criteria

- Uploading an image in the newsletter makes it available in that site's Media Library and Puck picker.
- An existing library image inserts without reuploading and survives draft save, reload, editing and preview.
- A PDF uploaded or selected from the library arrives as an actual email attachment, with the expected filename and bytes.
- Test, immediate and scheduled sends include the same images and attachments.
- Replacing or deleting the source asset does not silently change a queued newsletter or break its frozen image rendition.
- Old text-only campaigns, unsubscribe behaviour, consent rules and site branding remain functional.
- All changed sites pass their manifest-declared quality gates before release; fleet delivery is tracked per site and commit.

## Boundaries

This is an extension of the existing newsletter and asset systems. Keep Puck for page composition, Plate for newsletter editing, shadcn primitives, Lucide icons, Tailwind tokens, MongoDB and BetterAuth. Keep new or refactored code modules within the 600-line limit. Arbitrary remote attachment fetching, a replacement newsletter builder and changes to consent or recipient selection are outside this feature.

## Audit-driven acceptance requirements

- Persist authoritative visual/HTML/text mode. Switching views preserves content; converting HTML/text into visual content requires an explicit warned action, including after save/reopen. Full arbitrary HTML round-trip conversion is not promised.
- Reuse shared image rendering and media UI in production and the public walkthrough, using a minimal Plate image element compatible with the news node shape.
- Require trusted current-site asset provenance, not records fabricated by public reads. Stop unknown-key backfill and migrate legacy references intentionally.
- Prepare media and social icons once per batch; omit unconfigured social footer links.
- Atomic delivery claims and an interrupted-delivery review state protect overlapping dispatches and ambiguous outcomes; do not claim exactly-once external delivery.
- Add read-only cron verification before restoring ASAP scheduling, inspect its queue, and route through stable nginx/public origin. Manual dispatch already processes repeated 500-recipient batches and still requires immutable content.
- Schedule bounded snapshot cleanup. Thirty days is the earliest cleanup eligibility after completion/cancellation, not a precise deletion deadline. Sent images remain available.
- Run all manifest gates before the exact-commit blue/green release. Reconcile stale release documentation and track the complete fleet/template distribution; 49 demo directories include the separately configured ots-sauro-poc exception.

The ordered revised work and operational constraints are in [TASKS.md](./TASKS.md).
