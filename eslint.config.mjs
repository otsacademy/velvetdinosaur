import next from 'eslint-config-next';

const HOOK_RULES = {
  'react-hooks/exhaustive-deps': 'warn',
  'react-hooks/set-state-in-effect': 'warn',
  'react-hooks/purity': 'warn',
  'react-hooks/refs': 'warn',
  'react-hooks/static-components': 'warn',
  'react-hooks/preserve-manual-memoization': 'warn',
  'react-hooks/use-memo': 'warn',
  'react-hooks/incompatible-library': 'warn'
};

const TS_RULES = {
  '@typescript-eslint/no-explicit-any': 'warn'
};

const config = [
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/.next-visual/**',
      '**/.next.bak*/**',
      '**/.next-visual.bak*/**',
      '**/.bun-cache/**',
      '**/dist/**',
      '**/out/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/.eslintcache',
      // Local working folders of this site's checkout (design handoffs, exports, agent workspaces).
      'docs/mocks/**',
      'output/**',
      'workspace/**',
      '.agtx/**',
      '.playwright-cli/**',
      // Vendored upstream registry code (Potion + shadcn) is kept close to upstream.
      'registry/**'
    ]
  },
  ...next.map((c) => {
    const hasHooks = c.plugins && 'react-hooks' in c.plugins;
    const hasTs = c.plugins && '@typescript-eslint' in c.plugins;
    return {
      ...c,
      rules: {
        ...(c.rules ?? {}),
        ...(hasHooks ? HOOK_RULES : {}),
        ...(hasTs ? TS_RULES : {})
      }
    };
  })
];

export default config;
