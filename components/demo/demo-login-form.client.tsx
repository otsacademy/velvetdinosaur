"use client"

import { useState } from "react"
import { ArrowRight, Check, LoaderCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type DemoLoginFormProps = {
  nextPath: string
}

export function DemoLoginForm({ nextPath }: DemoLoginFormProps) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [name, setName] = useState("Maya Patel")
  const [email, setEmail] = useState("maya@oakandash.studio")

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault()
        setPending(true)
        setError("")

        try {
          const response = await fetch("/api/demo/session", { method: "POST" })
          if (!response.ok) {
            throw new Error("Unable to start the demo right now.")
          }
          window.location.assign(nextPath)
        } catch (caughtError) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to start the demo right now.")
          setPending(false)
        }
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="demo-name">Demo name</Label>
          <Input id="demo-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="demo-email">Demo email</Label>
          <Input
            id="demo-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </div>
      </div>

      <div className="rounded-[1.25rem] border border-[color-mix(in_oklch,var(--vd-border)_78%,transparent)] bg-[color-mix(in_oklch,var(--vd-muted)_68%,transparent)] p-4">
        <div className="flex items-start gap-3">
          <Check className="mt-0.5 h-4 w-4 text-[var(--vd-primary)]" />
          <p className="text-sm leading-6 text-[var(--vd-muted-fg)]">
            This is a simulated sign-in. It only unlocks the dummy workspace for this browser session.
          </p>
        </div>
      </div>

      {error ? <p className="text-sm text-[var(--vd-destructive)]">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--vd-primary)] px-6 text-sm font-medium text-[var(--vd-primary-fg)] disabled:opacity-60"
        >
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {pending ? "Entering workspace..." : "Continue as demo user"}
        </button>
        <span className="inline-flex min-h-11 items-center text-sm text-[var(--vd-muted-fg)]">
          No real account. No saved changes.
        </span>
      </div>
    </form>
  )
}
