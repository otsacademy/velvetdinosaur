import { Button } from '@/components/ui/button';
import { getStayBySlug } from '@/lib/content/stays';
import type { CTA } from '@/lib/content/types';
import type { ComponentConfig } from '@measured/puck';

type Stat = { label: string; value: string };

export type PricePanelProps = {
  staySlug?: string;
  headline?: string;
  priceLabel?: string;
  isStartingFrom?: boolean | 'true' | 'false';
  ctas?: CTA[];
  stats?: Stat[];
  footnote?: string;
};

function formatPrice(price?: number, currency?: string, isStartingFrom?: boolean) {
  if (!price) return '';
  const symbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€';
  const prefix = isStartingFrom ? 'From ' : '';
  return `${prefix}${symbol}${price} / night`;
}

export async function PricePanel(props: PricePanelProps) {
  const stay = props.staySlug ? await getStayBySlug(props.staySlug) : null;
  const startingFrom =
    props.isStartingFrom === true || props.isStartingFrom === 'true'
      ? true
      : props.isStartingFrom === 'false'
        ? false
        : stay?.isStartingFrom;

  const priceLabel = props.priceLabel || formatPrice(stay?.price, stay?.currency, startingFrom);

  const stats: Stat[] =
    (props.stats && props.stats.length > 0
      ? props.stats
      : stay?.details
        ? [
            stay.details.guests ? { label: 'Guests', value: String(stay.details.guests) } : null,
            stay.details.bedrooms ? { label: 'Bedrooms', value: String(stay.details.bedrooms) } : null,
            stay.details.bathrooms ? { label: 'Baths', value: String(stay.details.bathrooms) } : null,
            stay.details.size ? { label: 'Size', value: stay.details.size } : null
          ].filter(Boolean) as Stat[]
        : []) || [];

  const ctas = props.ctas && props.ctas.length > 0 ? props.ctas : stay?.ctas;
  const headline = props.headline || stay?.name || '';
  const hasContent = Boolean(headline || priceLabel || stats.length || (ctas && ctas.length) || props.footnote);

  if (!hasContent) return null;

  return (
    <section className="rounded-[2.5rem] border border-[var(--vd-border)] bg-white p-8 shadow-lg">
      <div className="space-y-4">
        {headline ? <h3 className="text-2xl font-black text-[var(--vd-fg)]">{headline}</h3> : null}
        {priceLabel ? (
          <p className="text-3xl font-black text-[var(--vd-primary)] tracking-tight">{priceLabel}</p>
        ) : null}
        {stats.length ? (
          <div className="grid grid-cols-2 gap-4 text-sm">
            {stats.map((stat) => (
              <div
                key={`${stat.label}-${stat.value}`}
                className="rounded-2xl bg-[var(--vd-muted)]/60 px-4 py-3"
              >
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--vd-muted-fg)]">{stat.label}</p>
                <p className="font-black text-[var(--vd-fg)]">{stat.value}</p>
              </div>
            ))}
          </div>
        ) : null}
        {ctas && ctas.length ? (
          <div className="flex flex-wrap gap-3">
            {ctas.map((cta) => (
              <Button
                key={cta.href}
                asChild
                variant={cta.variant === 'secondary' ? 'outline' : 'default'}
                className="rounded-full px-6 py-4 text-xs font-black uppercase tracking-widest"
              >
                <a href={cta.href} target={cta.target} rel={cta.rel}>
                  {cta.label}
                </a>
              </Button>
            ))}
          </div>
        ) : null}
        {props.footnote ? <p className="text-xs text-[var(--vd-muted-fg)]">{props.footnote}</p> : null}
      </div>
    </section>
  );
}

export const pricePanelConfig: ComponentConfig<PricePanelProps> = {
  fields: {
    staySlug: { type: 'text' },
    headline: { type: 'text' },
    priceLabel: { type: 'text' },
    isStartingFrom: {
      type: 'select',
      options: [
        { label: 'Yes (from)', value: 'true' },
        { label: 'No (exact)', value: 'false' }
      ]
    },
    footnote: { type: 'textarea' },
    stats: {
      type: 'array',
      arrayFields: {
        label: { type: 'text' },
        value: { type: 'text' }
      }
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
            { label: 'Ghost', value: 'ghost' },
            { label: 'Link', value: 'link' }
          ]
        }
      }
    }
  },
  defaultProps: {},
  render: (props) => PricePanel(props) as any
};
