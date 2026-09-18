/** Keep focus inside a newly opened dialog, or return it to the initiating control. */
export function restoreNewsletterDialogFocus(event: Event, restore?: () => void) {
  if (!restore) return;
  event.preventDefault();
  requestAnimationFrame(() => {
    if (!document.querySelector('[data-slot="dialog-content"][data-state="open"]')) restore();
  });
}
