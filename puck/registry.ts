import type { Config } from '@measured/puck';
import { storeBlocks } from '@/components/blocks/store';
import { coreComponents, withLayout } from '@/puck/registry-core';

export const config: Config = {
  components: Object.fromEntries(
    Object.entries({
      ...coreComponents,
      ...storeBlocks
    }).map(([key, value]) => [key, withLayout(value)])
  ) as Config['components']
};
