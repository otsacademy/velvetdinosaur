import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getStayBySlug } from '@/lib/content/stays';
import type { CTA } from '@/lib/content/types';
import type { ComponentConfig } from '@measured/puck';

export type CtaLinksProps = {
  staySlug?: string;
  title?: string;
  description?: string;
  ctas?: CTA[];
  align?: 'left' | 'center';
};

export async function CtaLinks(props: CtaLinksProps) {
  const stay = props.staySlug ? await getStayBySlug(props.staySlug) : null;
  const ctas = props.ctas && props.ctas.length > 0 ? props.ctas : stay?.ctas || [];
  const alignClass = props.align === 'center' ? 'items-center text-center justify-center' : 'items-start';
  const hasHeader = Boolean(props.title || props.description);
  const hasCtas = Boolean(ctas.length);

  if (!hasHeader && !hasCtas) return null;

  return (
    <section className={`flex flex-col gap-4 ${alignClass}`}>
      {hasHeader ? (
        <div className="space-y-2">
          {props.title ? (
            <h3 className="text-2xl font-black uppercase tracking-tighter text-[var(--vd-fg)]">{props.title}</h3>
          ) : null}
          {props.description ? (
            <p className="max-w-2xl text-sm text-[var(--vd-muted-fg)]">{props.description}</p>
          ) : null}
        </div>
      ) : null}
      {hasCtas ? (
        <div className="flex flex-wrap gap-3">
          {ctas.map((cta) => (
            <Button
              key={cta.href}
              asChild
              variant={cta.variant === 'secondary' ? 'outline' : 'default'}
              className="rounded-full px-6 py-4 text-xs font-black uppercase tracking-widest"
            >
              <a href={cta.href} target={cta.target} rel={cta.rel} className="inline-flex items-center gap-2">
                <span>{cta.label}</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export const ctaLinksConfig: ComponentConfig<CtaLinksProps> = {
  fields: {
    staySlug: { type: 'text' },
    title: { type: 'text' },
    description: { type: 'textarea' },
    align: {
      type: 'select',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' }
      ]
    },
    ctas: {
      type: 'array',
      arrayFields: {
        label: { type: 'text' },
        href: { type: 'text' },
        target: {
          type: 'select',
          options: [
            { label: 'Same tab', value: '_self' },
            { label: 'New tab', value: '_blank' }
          ]
        },
        rel: { type: 'text' },
        variant: {
          type: 'select',
          options: [
            { label: 'Primary', value: 'primary' },
            { label: 'Secondary', value: 'secondary' },
            { label: 'Ghost', value: 'ghost' }
          ]
        }
      }
    }
  },
  defaultProps: {},
  render: (props) => CtaLinks(props) as any
};
