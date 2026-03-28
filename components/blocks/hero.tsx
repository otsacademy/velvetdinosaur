/* eslint-disable @next/next/no-img-element */
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

export type LinkValue = {
  href?: string;
  target?: '_self' | '_blank';
  rel?: string;
};

export type HeroBlockProps = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryLink?: LinkValue;
  secondaryLink?: LinkValue;
  imageSrc?: string;
  imageAlt?: string;
};

export function HeroBlock({
  eyebrow = 'Demonstration page',
  title = 'A polished starting point for a fictional service business.',
  subtitle = 'Use neutral placeholder copy and imagery here, then replace it with the real brand once the project starts.',
  primaryLabel = 'Primary action',
  secondaryLabel = 'Secondary action',
  primaryLink,
  secondaryLink,
  imageSrc = '/assets/hero-panel.svg',
  imageAlt = 'Abstract placeholder visual'
}: HeroBlockProps) {
  const normalizeRel = (link?: LinkValue) => {
    if (!link?.target || link.target !== '_blank') return link?.rel;
    const rel = link?.rel?.trim();
    return rel ? rel : 'noopener noreferrer';
  };

  const PrimaryButton = (
    <Button asChild={Boolean(primaryLink?.href)}>
      {primaryLink?.href ? (
        <a href={primaryLink.href} target={primaryLink.target} rel={normalizeRel(primaryLink)}>
          {primaryLabel}
          <ArrowRight className="h-4 w-4" />
        </a>
      ) : (
        <>
          {primaryLabel}
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </Button>
  );

  const SecondaryButton = (
    <Button asChild={Boolean(secondaryLink?.href)} variant="outline">
      {secondaryLink?.href ? (
        <a href={secondaryLink.href} target={secondaryLink.target} rel={normalizeRel(secondaryLink)}>
          {secondaryLabel}
        </a>
      ) : (
        secondaryLabel
      )}
    </Button>
  );

  return (
    <section className="rounded-[calc(var(--vd-radius)+8px)] border border-[var(--vd-border)] bg-[var(--vd-card)] px-10 py-16">
      <div className="mb-6 h-40 w-full overflow-hidden rounded-[calc(var(--vd-radius)+4px)] border border-[var(--vd-border)]">
        <img
          src={imageSrc}
          alt={imageAlt}
          width={1200}
          height={600}
          className="h-full w-full object-cover"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      </div>
      <Badge className="mb-4 inline-flex">{eyebrow}</Badge>
      <h1 className="text-4xl font-semibold tracking-tight md:text-5xl" style={{ fontFamily: 'var(--vd-font-display)' }}>
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-base text-[var(--vd-muted-fg)]">{subtitle}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        {PrimaryButton}
        {SecondaryButton}
      </div>
    </section>
  );
}
