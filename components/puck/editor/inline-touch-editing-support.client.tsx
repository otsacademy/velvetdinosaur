'use client';

import * as React from 'react';

/** Makes Puck inline fields focusable on touch devices, where mouse hover is unavailable. */
export function InlineTouchEditingSupport() {
  const markerRef = React.useRef<HTMLSpanElement | null>(null);

  React.useEffect(() => {
    const frameDocument = markerRef.current?.ownerDocument;
    if (!frameDocument) return;

    const focusInlineField = (event: Event) => {
      const target = event.target;
      if (!(target instanceof frameDocument.defaultView!.Element)) return;
      const field = target.closest<HTMLElement>(
        'span[data-puck-overlay-portal][contenteditable="false"]'
      );
      if (!field) return;

      field.tabIndex = 0;
      field.setAttribute('contenteditable', 'plaintext-only');
      field.focus({ preventScroll: true });
      event.stopPropagation();
    };

    const keepInlineTapOnCanvas = (event: Event) => {
      const target = event.target;
      if (!(target instanceof frameDocument.defaultView!.Element)) return;
      const field = target.closest<HTMLElement>(
        'span[data-puck-overlay-portal][contenteditable="plaintext-only"]'
      );
      if (field) event.stopPropagation();
    };

    frameDocument.addEventListener('pointerdown', focusInlineField, true);
    frameDocument.addEventListener('touchstart', focusInlineField, true);
    frameDocument.addEventListener('click', keepInlineTapOnCanvas, true);
    return () => {
      frameDocument.removeEventListener('pointerdown', focusInlineField, true);
      frameDocument.removeEventListener('touchstart', focusInlineField, true);
      frameDocument.removeEventListener('click', keepInlineTapOnCanvas, true);
    };
  }, []);

  return <span ref={markerRef} data-vd-inline-touch-support hidden aria-hidden="true" />;
}
