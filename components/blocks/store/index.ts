import type { ComponentConfig } from '@measured/puck';

import { storeBlocksCurated } from './curated';
import { storeBlocksGenerated } from './generated';

// Generated blocks come from the shared component-store installer.
// Curated blocks live in-repo and should win on key collisions.
export const storeBlocks: Record<string, ComponentConfig> = {
  ...storeBlocksGenerated,
  ...storeBlocksCurated
};

