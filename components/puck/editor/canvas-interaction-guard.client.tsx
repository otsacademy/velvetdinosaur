'use client';

import * as React from 'react';

const EDITOR_CONTROL_SELECTOR =
  '[data-puck-overlay], [data-puck-overlay-portal], [data-puck-rte-menu]';
const ACTIONABLE_SELECTOR =
  'a, button, input[type="button"], input[type="submit"], input[type="image"], [role="button"]';

/**
 * Keeps the live Puck canvas available for selection and inline editing while
 * preventing the rendered website from navigating, submitting, or running
 * visitor-facing button actions inside the editor iframe.
 */
export function CanvasInteractionGuard({ children }: { children: React.ReactNode }) {
  const guardRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const guard = guardRef.current;
    if (!guard) return;
    const protectedActions = new Set<Element>();
    const protectedForms = new Set<HTMLFormElement>();
    const originalHrefs = new Map<HTMLAnchorElement, string>();

    const blockCanvasAction = (event: Event) => {
      const actionable = event.currentTarget as Element | null;
      event.preventDefault();

      // Links (including Next.js links) honour defaultPrevented, allowing
      // Puck's selection handlers to finish. Buttons can ignore it, so stop
      // those before their visitor-facing React handlers run.
      if (!actionable?.matches('a')) {
        event.stopImmediatePropagation();
      }
    };

    const blockCanvasSubmit = (event: Event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    };

    const protectCurrentActions = () => {
      guard.querySelectorAll(ACTIONABLE_SELECTOR).forEach((actionable) => {
        if (actionable.closest(EDITOR_CONTROL_SELECTOR)) return;
        if (actionable instanceof guard.ownerDocument.defaultView!.HTMLAnchorElement) {
          const href = actionable.getAttribute('href');
          if (href !== null) {
            if (!originalHrefs.has(actionable)) originalHrefs.set(actionable, href);
            actionable.dataset.vdEditorCanvasHref = href;
            actionable.removeAttribute('href');
          }
        }
        if (protectedActions.has(actionable)) return;
        actionable.addEventListener('click', blockCanvasAction, true);
        actionable.addEventListener('auxclick', blockCanvasAction, true);
        protectedActions.add(actionable);
      });
      guard.querySelectorAll('form').forEach((form) => {
        if (form.closest(EDITOR_CONTROL_SELECTOR) || protectedForms.has(form)) return;
        form.addEventListener('submit', blockCanvasSubmit, true);
        protectedForms.add(form);
      });
    };

    const MutationObserverConstructor = guard.ownerDocument.defaultView?.MutationObserver;
    const observer = MutationObserverConstructor
      ? new MutationObserverConstructor(protectCurrentActions)
      : null;

    guard.dataset.vdCanvasInteractionGuardActive = 'true';
    protectCurrentActions();
    observer?.observe(guard, {
      attributes: true,
      attributeFilter: ['href'],
      childList: true,
      subtree: true
    });
    return () => {
      observer?.disconnect();
      delete guard.dataset.vdCanvasInteractionGuardActive;
      protectedActions.forEach((actionable) => {
        actionable.removeEventListener('click', blockCanvasAction, true);
        actionable.removeEventListener('auxclick', blockCanvasAction, true);
      });
      protectedForms.forEach((form) => {
        form.removeEventListener('submit', blockCanvasSubmit, true);
      });
      originalHrefs.forEach((href, anchor) => {
        anchor.setAttribute('href', href);
        delete anchor.dataset.vdEditorCanvasHref;
      });
    };
  }, []);

  return (
    <div
      ref={guardRef}
      className="contents"
      data-vd-canvas-interaction-guard
    >
      {children}
    </div>
  );
}
