import type { ComponentConfig } from '@measured/puck';

// Client-side block implementations for the Puck editor.
//
// Important: many store blocks are async Server Components and/or import server-only
// modules (e.g. Next "use cache" helpers). Those must never be pulled into the
// browser bundle. The editor already provides schema-driven placeholders, so this
// can stay empty unless a block is explicitly client-safe.
export const storeBlocksClient: Record<string, ComponentConfig<any>> = {};

