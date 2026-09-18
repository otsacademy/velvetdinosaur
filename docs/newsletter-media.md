# Newsletter images and attachments

Open **Newsletter** at `/edit/newsletter` and select a draft or choose **New draft**.

## Add or edit an image

1. In **Editor**, place the cursor where the image belongs and choose **Image**.
2. In **Choose newsletter image**, upload or select a JPEG, PNG or WebP from this site's Media Library.
3. Enter **Alternative text** describing the information the image adds, or select **Decorative image (empty alternative text)** if it adds none. A caption does not replace alternative text.
4. Optionally set **Caption**, **Image link (optional)**, **Width (1–560 px)** and **Alignment**, then choose **Save image**.

Use **Edit image** to change details and **Replace image** to choose another file. Review the description after replacement. The bin button removes the image from the draft.

Images keep their proportions without cropping, at up to 1120 pixels wide. They display at up to 560 pixels and shrink on smaller screens.

## Add attachments

Choose **Add attachment**, then upload or select a file. The counter shows file count and total size. Each file has preview, download and remove buttons; preview and download open the current library source.

| Limit | Supported behavior |
| --- | --- |
| File count | Up to **5 different files**; the same file cannot be added twice. |
| Combined size | **5 MiB or less**: 5,242,880 bytes across all prepared attachments. |
| File types | PDF, JPEG and PNG. WebP images are also accepted and converted to JPEG or PNG for delivery. |

If the complete email is too large, remove an attachment or shorten the message. For preparation errors, correct the reported problem and choose **Retry preparation**. Older files with unverified ownership need reuploading or a maintainer's review.

## Choose which version will be sent

**Show HTML & Plain Text** reveals the advanced tabs. Changing tabs alone preserves your images and does not change which version controls delivery.

| Where you edit | What controls delivery |
| --- | --- |
| **Editor** | The visual document generates both HTML and plain text. |
| **HTML** | Your edited HTML controls the formatted email. The saved plain-text alternative is preserved. |
| **Plain Text** | Your edited text controls delivery; a simple HTML version is generated from it. |

After editing HTML or plain text, the notice identifies the delivery version and offers:

- **Resume saved visual version** regenerates HTML and plain text from the preserved visual document. Copy any source edits you want to keep first.
- **Convert plain text to visual** replaces the saved visual document and HTML with the current plain text. This removes its images and formatting; it does not import HTML.

Confirm either action with **Continue**. Review both **HTML** and **Plain text** within **Preview** before sending.

## Queue and send

Choose **Save draft**, then **Queue campaign**. Queueing captures the content, selected newsletter image versions and attachments. Changing or deleting their Media Library originals does not replace those queued copies. Sent newsletter images remain available independently of the originals.

This protection covers newsletter picker images. Other websites still control their images linked in custom HTML; those images are not copied or frozen.

Before queued delivery starts, **Cancel schedule** returns the campaign to a draft. Save and queue it again after editing. **Send test** sends an actual email on a live site; **Preview** does not.

## Demos and delivery review

The public demonstration workspace keeps changes in the demo session and simulates queueing, tests and dispatch without sending email. Installed demo sites allow drafts and previews, but real newsletter sending is disabled by default; a site maintainer must explicitly enable it.

**Needs review** means a delivery's outcome is uncertain: the email may already have been sent. Automatic sending for that campaign pauses. In **Delivery Log**, filter by **Needs review** and give your maintainer the campaign, recipient, **Postmark ID** if present, and **Error**. They should check the delivery service's activity before any retry to avoid sending a duplicate.

Maintainers: see the [newsletter operations and release runbook](../ops/scripts/NEWSLETTER_RELEASE.md).
