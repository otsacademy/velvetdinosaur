import type { ReactNode } from "react"

import { DesignShell } from "@/components/home/design-shell"

export default function WorkArticleLayout({ children }: { children: ReactNode }) {
  return <DesignShell active="work">{children}</DesignShell>
}
