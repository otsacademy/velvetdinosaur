import Image from 'next/image'

import { Facebook, Linkedin, Twitter } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

type NewsSocialPreviewProps = {
  title: string
  description: string
  openGraphTitle?: string
  openGraphDescription?: string
  openGraphImage?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
}

type PreviewCardProps = {
  platformLabel: string
  icon: React.ReactNode
  previewTitle: string
  previewDescription: string
  image: string
}

const FALLBACK_IMAGE = '/images/placeholder.svg'

function SocialPreviewCard({
  platformLabel,
  icon,
  previewTitle,
  previewDescription,
  image,
}: PreviewCardProps) {
  return (
    <Card className="overflow-hidden border-border">
      <CardHeader className="space-y-1 pb-2">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-sm font-medium">{platformLabel}</CardTitle>
        </div>
        <CardDescription className="text-xs">Post preview</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-3 pt-0">
        <div className="overflow-hidden rounded-md border border-border/60">
          <Image
            alt="Social share image"
            className="h-32 w-full object-cover"
            height={180}
            width={320}
            src={image}
            unoptimized
          />
        </div>
        <div>
          <p className="line-clamp-2 text-sm font-semibold">{previewTitle || 'Untitled'}</p>
          <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{previewDescription || 'No description'}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function NewsSocialPreview({
  title,
  description,
  openGraphTitle,
  openGraphDescription,
  openGraphImage,
  twitterTitle,
  twitterDescription,
  twitterImage,
}: NewsSocialPreviewProps) {
  const linkedInTitle = openGraphTitle || title
  const linkedInDescription = openGraphDescription || description
  const linkedInImage = (openGraphImage || '').trim() || FALLBACK_IMAGE

  const xTitle = twitterTitle || title
  const xDescription = twitterDescription || description
  const xImage = (twitterImage || openGraphImage || '').trim() || FALLBACK_IMAGE

  const facebookTitle = openGraphTitle || title
  const facebookDescription = openGraphDescription || description
  const facebookImage = (openGraphImage || '').trim() || FALLBACK_IMAGE

  const missingOpenGraphImage = !(openGraphImage || '').trim()

  return (
    <div className="space-y-3 rounded-md border border-border bg-muted/25 p-3">
      <h4 className="text-sm font-semibold">Social card previews</h4>
      {missingOpenGraphImage ? (
        <Alert>
          <AlertTitle>Open Graph image missing</AlertTitle>
          <AlertDescription>
            Add an Open Graph image so Facebook and LinkedIn previews render correctly.
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <SocialPreviewCard
          icon={<Linkedin className="h-4 w-4 text-foreground" />}
          platformLabel="LinkedIn"
          previewTitle={linkedInTitle}
          previewDescription={linkedInDescription}
          image={linkedInImage}
        />
        <SocialPreviewCard
          icon={<Twitter className="h-4 w-4 text-foreground" />}
          platformLabel="X"
          previewTitle={xTitle}
          previewDescription={xDescription}
          image={xImage}
        />
        <SocialPreviewCard
          icon={<Facebook className="h-4 w-4 text-foreground" />}
          platformLabel="Facebook"
          previewTitle={facebookTitle}
          previewDescription={facebookDescription}
          image={facebookImage}
        />
      </div>
    </div>
  )
}
