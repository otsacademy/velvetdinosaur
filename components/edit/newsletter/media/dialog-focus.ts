/** Keep focus inside a newly opened dialog, or return it to the initiating control. */
export function restoreNewsletterDialogFocus(event: Event, restore?: () => void) {
  if (!restore) return;
  event.preventDefault();
  const closingDialog = event.target instanceof Element ? event.target : null;
  requestAnimationFrame(() => {
    if (document.querySelector('[data-slot="dialog-content"][data-state="open"]')) return;
    const active = document.activeElement;
    // Respect focus deliberately moved elsewhere while the closing frame was queued.
    if (!active || active === document.body || active === document.documentElement || !active.isConnected || closingDialog?.contains(active)) restore();
  });
}
