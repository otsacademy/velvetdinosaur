import type { ComponentConfig } from '@measured/puck';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { siteConfig } from '@/lib/site-config';

export type ReviewsCtaProps = {
  heading?: string;
  body?: string;
  buttonLabel?: string;
  url?: string;
  variant?: 'primary' | 'secondary';
};

const PLACEHOLDER_URL = '<set in env>';

export function ReviewsCta(props: ReviewsCtaProps) {
  const url = props.url || siteConfig.googleReviewsUrl || '';
  const hasUrl = Boolean(url && url !== PLACEHOLDER_URL);
  const variant = props.variant === 'secondary' ? 'outline' : 'default';

  return (
    <section className="px-6 sm:px-12 pb-20 max-w-5xl mx-auto">
      <Card className="rounded-[2.5rem] bg-white border border-[var(--vd-border)] shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-black uppercase tracking-tighter text-[var(--vd-fg)]">
            {props.heading || 'Read our Google Reviews'}
          </CardTitle>
          {props.body ? (
            <CardDescription className="text-sm text-[var(--vd-muted-fg)]">{props.body}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent>
          {!hasUrl ? (
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--vd-muted-fg)]">
              Set NEXT_PUBLIC_GOOGLE_REVIEWS_URL
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="justify-start">
          {hasUrl ? (
            <Button asChild variant={variant} className="rounded-full px-8 py-5 text-xs font-black uppercase tracking-[0.2em]">
              <a href={url} target="_blank" rel="noreferrer">
                {props.buttonLabel || 'Read Google Reviews'}
              </a>
            </Button>
          ) : (
            <Button
              type="button"
              disabled
              variant={variant}
              className="rounded-full px-8 py-5 text-xs font-black uppercase tracking-[0.2em]"
            >
              {props.buttonLabel || 'Read Google Reviews'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </section>
  );
}

export const reviewsCtaConfig: ComponentConfig<ReviewsCtaProps> = {
  fields: {
    heading: { type: 'text' },
    body: { type: 'textarea' },
    buttonLabel: { type: 'text' },
    url: { type: 'text' },
    variant: {
      type: 'select',
      options: [
        { label: 'Primary', value: 'primary' },
        { label: 'Secondary', value: 'secondary' }
      ]
    }
  },
  defaultProps: {
    heading: 'Read our Google Reviews',
    body: 'See what our guests and partners have shared about their Brave experiences.',
    buttonLabel: 'Read Google Reviews',
    url: siteConfig.googleReviewsUrl || '',
    variant: 'primary'
  },
  render: (props) => ReviewsCta(props)
};
