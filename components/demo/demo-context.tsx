'use client';

import * as React from 'react';

export type DemoMode = 'site' | 'demo';

export type DemoContentContextValue = {
  mode: DemoMode;
  openLogin: () => void;
};

const DemoContentContext = React.createContext<DemoContentContextValue>({
  mode: 'site',
  openLogin: () => {}
});

export function DemoContentProvider({
  value,
  children
}: {
  value: DemoContentContextValue;
  children: React.ReactNode;
}) {
  return <DemoContentContext.Provider value={value}>{children}</DemoContentContext.Provider>;
}

export function useDemoContent() {
  return React.useContext(DemoContentContext);
}

