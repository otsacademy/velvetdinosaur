import { Suspense, type ReactNode } from "react"

// The /work index renders inside the shared 2026 DesignShell itself; the
// /work/[slug] case studies get the shell from their own nested layout.
export default function WorkLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>
}
