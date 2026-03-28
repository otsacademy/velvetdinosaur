"use client"

import { useState } from "react"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

type DemoSignOutButtonProps = {
  landingHref: string
}

export function DemoSignOutButton({ landingHref }: DemoSignOutButtonProps) {
  const [pending, setPending] = useState(false)

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="vd-demo-toolbar-button vd-demo-toolbar-button-subtle"
      disabled={pending}
      onClick={async () => {
        setPending(true)
        try {
          await fetch("/api/demo/session", { method: "DELETE" })
        } finally {
          window.location.assign(landingHref)
        }
      }}
    >
      <LogOut className="h-4 w-4" />
      {pending ? "Signing out..." : "Sign out"}
    </Button>
  )
}
