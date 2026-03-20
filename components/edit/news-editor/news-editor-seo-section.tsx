'use client'

import { ChevronRight, Loader2, Sparkles } from 'lucide-react'
import { CollapsibleAssetField } from '@/components/edit/collapsible-asset-field'
import { NewsSocialPreview } from '@/components/edit/news-social-preview'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

type SeoProviderInfo = {
  configured: boolean
  envVar: string
}

type NewsEditorSeoSectionProps = {
  title: string
  description: string
  openGraphTitle: string
  openGraphDescription: string
  openGraphImage: string
  twitterTitle: string
  twitterDescription: string
  twitterImage: string
  seoTitle: string
  seoDescription: string
  seoStatus: string
  seoStatusVariant: 'default' | 'secondary'
  seoNeedsReview: boolean
  seoNeedsGuidance: boolean
  seoReviewReasons: string[]
  providerInfo: SeoProviderInfo
  isGenerateReady: boolean
  seoProviderLoading: boolean
  seoGenerating: boolean
  seoApplyLoading: boolean
  seoPreviewOpen: boolean
  seoPreviewTitle: string
  seoPreviewDescription: string
  seoGenerateError?: string
  onOpenGraphTitleChange: (value: string) => void
  onOpenGraphDescriptionChange: (value: string) => void
  onOpenGraphImageChange: (value: string) => void
  onTwitterTitleChange: (value: string) => void
  onTwitterDescriptionChange: (value: string) => void
  onTwitterImageChange: (value: string) => void
  onSeoTitleChange: (value: string) => void
  onSeoDescriptionChange: (value: string) => void
  onGenerateSeo: () => void
  onApplySeoPreview: () => void
  onDiscardSeoPreview: () => void
}

export function NewsEditorSeoSection({
  title,
  description,
  openGraphTitle,
  openGraphDescription,
  openGraphImage,
  twitterTitle,
  twitterDescription,
  twitterImage,
  seoTitle,
  seoDescription,
  seoStatus,
  seoStatusVariant,
  seoNeedsReview,
  seoNeedsGuidance,
  seoReviewReasons,
  providerInfo,
  isGenerateReady,
  seoProviderLoading,
  seoGenerating,
  seoApplyLoading,
  seoPreviewOpen,
  seoPreviewTitle,
  seoPreviewDescription,
  seoGenerateError,
  onOpenGraphTitleChange,
  onOpenGraphDescriptionChange,
  onOpenGraphImageChange,
  onTwitterTitleChange,
  onTwitterDescriptionChange,
  onTwitterImageChange,
  onSeoTitleChange,
  onSeoDescriptionChange,
  onGenerateSeo,
  onApplySeoPreview,
  onDiscardSeoPreview,
}: NewsEditorSeoSectionProps) {
  return (
    <AccordionItem value="seo">
      <AccordionTrigger>
        <span className="flex items-center gap-2">
          SEO &amp; Social
          {seoNeedsReview || !seoTitle.trim() || !seoDescription.trim() ? (
            <Badge variant="default" className="text-[10px] uppercase tracking-wide">
              Needs review
            </Badge>
          ) : null}
        </span>
      </AccordionTrigger>
      <AccordionContent className="space-y-4">
        {seoNeedsGuidance ? (
          <div className="space-y-1.5 rounded-md border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Needs review</p>
            {seoReviewReasons.length > 0 ? (
              <div className="space-y-1">
                {seoReviewReasons.map((reason) => (
                  <p key={reason}>• {reason}</p>
                ))}
              </div>
            ) : null}
            <p>Recommended lengths: title 50-60 characters, description 150-160 characters.</p>
            <p>If fields are blank, social cards fall back to article title, summary, and hero image.</p>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="open-graph-title">Open Graph title</Label>
          <Input
            id="open-graph-title"
            value={openGraphTitle}
            onChange={(event) => onOpenGraphTitleChange(event.target.value)}
            placeholder="Optional: defaults to article title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="open-graph-description">Open Graph description</Label>
          <Textarea
            id="open-graph-description"
            value={openGraphDescription}
            onChange={(event) => onOpenGraphDescriptionChange(event.target.value)}
            placeholder="Optional: defaults to summary"
            className="min-h-[90px]"
          />
        </div>

        <CollapsibleAssetField label="Open Graph image" value={openGraphImage} onChange={onOpenGraphImageChange} />

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="twitter-title">X title</Label>
          <Input
            id="twitter-title"
            value={twitterTitle}
            onChange={(event) => onTwitterTitleChange(event.target.value)}
            placeholder="Optional: defaults to Open Graph title or article title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="twitter-description">X description</Label>
          <Textarea
            id="twitter-description"
            value={twitterDescription}
            onChange={(event) => onTwitterDescriptionChange(event.target.value)}
            placeholder="Optional: defaults to Open Graph description or summary"
            className="min-h-[90px]"
          />
        </div>

        <CollapsibleAssetField label="X image" value={twitterImage} onChange={onTwitterImageChange} />

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label>SEO metadata</Label>
            <Badge variant={seoStatusVariant === 'default' ? 'default' : 'outline'}>{seoStatus}</Badge>
          </div>

          <div className="space-y-1">
            <Label htmlFor="seo-title">SEO title</Label>
            <Input
              id="seo-title"
              value={seoTitle}
              onChange={(event) => onSeoTitleChange(event.target.value)}
              placeholder="Optional SEO title"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="seo-description">SEO description</Label>
            <Textarea
              id="seo-description"
              value={seoDescription}
              onChange={(event) => onSeoDescriptionChange(event.target.value)}
              placeholder="Optional SEO description"
              className="min-h-[90px]"
            />
          </div>

          {providerInfo.configured ? (
            <div className="space-y-2">
              <Button size="sm" onClick={onGenerateSeo} disabled={!isGenerateReady}>
                {seoGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {seoGenerating ? 'Generating…' : 'Generate SEO'}
              </Button>
              {seoProviderLoading ? <p className="text-xs text-muted-foreground">Checking provider status…</p> : null}
            </div>
          ) : (
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertTitle>Set up AI SEO</AlertTitle>
              <AlertDescription>
                Add <code>{providerInfo.envVar}</code> to the server environment to enable SEO generation.
                <span className="mt-1 flex items-center text-xs">
                  Setup required <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </span>
              </AlertDescription>
            </Alert>
          )}

          {seoGenerateError ? <p className="text-xs text-destructive">{seoGenerateError}</p> : null}

          {seoPreviewOpen ? (
            <div className="space-y-2 rounded-lg border border-border/60 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Preview</p>
              <Input value={seoPreviewTitle} readOnly />
              <Textarea value={seoPreviewDescription} readOnly className="min-h-[90px]" />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={onApplySeoPreview} disabled={seoApplyLoading}>
                  {seoApplyLoading ? 'Applying…' : 'Apply'}
                </Button>
                <Button size="sm" variant="outline" onClick={onDiscardSeoPreview} disabled={seoApplyLoading}>
                  Discard
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <NewsSocialPreview
          title={title}
          description={description}
          openGraphTitle={openGraphTitle}
          openGraphDescription={openGraphDescription}
          openGraphImage={openGraphImage}
          twitterTitle={twitterTitle}
          twitterDescription={twitterDescription}
          twitterImage={twitterImage}
        />
      </AccordionContent>
    </AccordionItem>
  )
}
