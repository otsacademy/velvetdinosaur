import type { ComponentConfig } from '@puckeditor/core';

// Client-side block implementations for the Puck editor.
//
// Important: many store blocks are async Server Components and/or import server-only
// modules (e.g. Next "use cache" helpers). Those must never be pulled into the
// browser bundle. The editor already provides schema-driven placeholders, so this
// can stay empty unless a block is explicitly client-safe.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing code; lint rules aligned with ASAP's in Nov 2026
export const storeBlocksClient: Record<string, ComponentConfig<any>> = {};

