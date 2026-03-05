import next from 'eslint-config-next';

const HOOK_RULES = {
  'react-hooks/exhaustive-deps': 'off',
  'react-hooks/set-state-in-effect': 'off',
  'react-hooks/purity': 'off',
  'react-hooks/refs': 'off',
  'react-hooks/static-components': 'off',
  'react-hooks/preserve-manual-memoization': 'off',
  'react-hooks/use-memo': 'off',
  'react-hooks/incompatible-library': 'off'
};

const TS_RULES = {
  '@typescript-eslint/no-explicit-any': 'off'
};

const NEXT_RULES = {
  '@next/next/no-img-element': 'off'
};

const config = [
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/.bun-cache/**',
      '**/dist/**',
      '**/out/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/.eslintcache'
    ]
  },
  ...next.map((c) => {
    const hasHooks = c.plugins && 'react-hooks' in c.plugins;
    const hasTs = c.plugins && '@typescript-eslint' in c.plugins;
    return {
      ...c,
      rules: {
        ...(c.rules ?? {}),
        ...NEXT_RULES,
        ...(hasHooks ? HOOK_RULES : {}),
        ...(hasTs ? TS_RULES : {})
      }
    };
  })
];

export default config;
