/* eslint-disable @next/next/no-img-element */
import type { ComponentConfig } from '@measured/puck';

export type BackgroundManifestoProps = {
  imageUrl?: string;
  imageAlt?: string;
  imageHeading?: string;
  title?: string;
  accent?: string;
  items?: Array<string | { value?: string }>;
};

export function BackgroundManifesto(props: BackgroundManifestoProps) {
  const items = (props.items || [])
    .map((item) => (typeof item === 'string' ? item : item?.value))
    .filter((item): item is string => Boolean(item));
  const hasHeader = Boolean(props.title || props.accent);
  const hasImage = Boolean(props.imageUrl);

  if (!hasHeader && !hasImage && items.length === 0) return null;

  return (
    <section className="mb-24 max-w-7xl mx-auto px-6 sm:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
      <div className="relative">
        {props.imageUrl ? (
          <img
            src={props.imageUrl}
            alt={props.imageAlt || ''}
            className="rounded-[3rem] w-full aspect-[16/10] object-cover"
          />
        ) : null}
        {props.imageHeading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <h3 className="text-white text-3xl sm:text-5xl font-black uppercase text-center tracking-tighter px-12">
              {props.imageHeading}
            </h3>
          </div>
        ) : null}
      </div>

      <div className="space-y-8">
        {hasHeader ? (
          <div className="flex items-end gap-4">
            <h3 className="text-3xl font-black uppercase text-[var(--vd-fg)] tracking-tighter">
              {props.title}{' '}
              {props.accent ? (
                <span className="text-[var(--vd-primary)] font-display lowercase font-normal italic">
                  {props.accent}
                </span>
              ) : null}
            </h3>
            <div className="h-[2px] flex-1 bg-[var(--vd-muted)] mb-2" />
          </div>
        ) : null}
        {items.length > 0 ? (
          <ul className="space-y-6">
            {items.map((point, idx) => {
              const indexLabel = String(idx + 1).padStart(2, '0');
              return (
                <li key={`${point}-${idx}`} className="flex gap-4 items-start p-4 rounded-2xl">
                  <span className="text-[var(--vd-primary)] mt-0.5 font-bold text-sm">{indexLabel}</span>
                  <p className="text-[var(--vd-muted-fg)] text-base leading-relaxed font-medium">{point}</p>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

export const backgroundManifestoConfig: ComponentConfig<BackgroundManifestoProps> = {
  fields: {
    imageUrl: { type: 'text' },
    imageAlt: { type: 'text' },
    imageHeading: { type: 'text' },
    title: { type: 'text' },
    accent: { type: 'text' },
    items: { type: 'array', arrayFields: { value: { type: 'text' } } }
  },
  defaultProps: {
    imageUrl: '',
    imageAlt: '',
    imageHeading: '',
    title: '',
    accent: '',
    items: []
  },
  render: (props) => BackgroundManifesto(props) as any
};
