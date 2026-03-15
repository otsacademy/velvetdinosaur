import { Button } from '@/components/ui/button';
import type { LinkValue } from '@/components/blocks/hero';

export type CTAStripProps = {
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  buttonLink?: LinkValue;
};

export function CTAStrip({
  title = 'Ready to ship your next site?',
  subtitle = 'Spin up another site in minutes with the same core stack.',
  buttonLabel = 'Create a new site',
  buttonLink
}: CTAStripProps) {
  const normalizeRel = (link?: LinkValue) => {
    if (!link?.target || link.target !== '_blank') return link?.rel;
    const rel = link?.rel?.trim();
    return rel ? rel : 'noopener noreferrer';
  };

  return (
    <section className="flex flex-col gap-4 rounded-[calc(var(--vd-radius)+6px)] border border-[var(--vd-border)] bg-[color-mix(in_srgb,var(--vd-accent)_18%,var(--vd-bg))] px-8 py-10 text-foreground md:flex-row md:items-center md:justify-between">
      <div>
        <h3 className="text-2xl font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <Button
        asChild={Boolean(buttonLink?.href)}
        className="bg-[hsl(204,88%,40%)] text-white hover:bg-[hsl(204,88%,36%)]"
      >
        {buttonLink?.href ? (
          <a href={buttonLink.href} target={buttonLink.target} rel={normalizeRel(buttonLink)}>
            {buttonLabel}
          </a>
        ) : (
          buttonLabel
        )}
      </Button>
    </section>
  );
}
