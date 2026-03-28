"use client"

import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DemoResetButton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="vd-demo-toolbar-button vd-demo-toolbar-button-subtle"
      onClick={() => window.location.reload()}
    >
      <RotateCcw className="h-4 w-4" />
      Reset demo
    </Button>
  )
}
