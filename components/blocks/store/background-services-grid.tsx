import type { ComponentConfig } from '@measured/puck';

export type BackgroundServiceItem = {
  title?: string;
  items?: Array<string | { value?: string }>;
};

export type BackgroundServicesGridProps = {
  services?: BackgroundServiceItem[];
};

export function BackgroundServicesGrid(props: BackgroundServicesGridProps) {
  const normalizeItems = (items: Array<string | { value?: string }> | undefined) =>
    (items || [])
      .map((item) => (typeof item === 'string' ? item : item?.value))
      .filter((item): item is string => Boolean(item));

  const services = (props.services || []).filter(
    (service) => Boolean(service?.title) || Boolean(service?.items && service.items.length > 0)
  );

  if (services.length === 0) return null;

  return (
    <section className="px-6 sm:px-12 mb-24 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {services.map((service, idx) => {
          const items = normalizeItems(service.items);
          return (
            <div
              key={`${service.title || 'service'}-${idx}`}
              className="bg-white rounded-2xl p-6 border border-[var(--vd-border)] h-full flex flex-col"
            >
              <div className="flex items-center gap-3 border-b border-[var(--vd-border)] pb-4 mb-5">
                <span className="w-2.5 h-2.5 bg-[var(--vd-primary)] rounded-full" />
                {service.title ? (
                  <h4 className="text-xl font-black uppercase tracking-tight text-[var(--vd-fg)]">
                    {service.title}
                  </h4>
                ) : null}
              </div>
              {items.length > 0 ? (
                <ul className="space-y-4 flex-1">
                  {items.map((item, itemIdx) => (
                    <li key={`${item}-${itemIdx}`} className="text-sm text-[var(--vd-muted-fg)] flex gap-3 leading-relaxed">
                      <span className="text-[var(--vd-primary)] font-bold shrink-0 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export const backgroundServicesGridConfig: ComponentConfig<BackgroundServicesGridProps> = {
  fields: {
    services: {
      type: 'array',
      arrayFields: {
        title: { type: 'text' },
        items: { type: 'array', arrayFields: { value: { type: 'text' } } }
      }
    }
  },
  defaultProps: {
    services: []
  },
  render: (props) => BackgroundServicesGrid(props) as any
};
