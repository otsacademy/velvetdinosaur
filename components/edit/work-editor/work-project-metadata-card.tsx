'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type WorkProjectMetadataCardProps = {
  subtitle: string
  website: string
  outcome: string
  onSubtitleChange: (value: string) => void
  onWebsiteChange: (value: string) => void
  onOutcomeChange: (value: string) => void
}

export function WorkProjectMetadataCard({
  subtitle,
  website,
  outcome,
  onSubtitleChange,
  onWebsiteChange,
  onOutcomeChange,
}: WorkProjectMetadataCardProps) {
  return (
    <Card className="mb-4 border-border/60 bg-background/90">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Project card details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="work-subtitle">Subtitle</Label>
          <Input
            id="work-subtitle"
            value={subtitle}
            onChange={(event) => onSubtitleChange(event.target.value)}
            placeholder="Values-led ethical tourism platform"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="work-website">Live website</Label>
          <Input
            id="work-website"
            value={website}
            onChange={(event) => onWebsiteChange(event.target.value)}
            placeholder="https://example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="work-outcome">Outcome</Label>
          <Textarea
            id="work-outcome"
            value={outcome}
            onChange={(event) => onOutcomeChange(event.target.value)}
            placeholder="Stronger brand differentiation and clearer user pathways."
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  )
}
