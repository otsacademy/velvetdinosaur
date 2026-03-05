import type { ComponentConfig } from '@measured/puck';

export type LegalSection = {
  heading?: string;
  body?: string;
};

export type LegalDocumentProps = {
  title?: string;
  lastUpdated?: string;
  sections?: LegalSection[];
};

function renderBody(body?: string) {
  if (!body) return null;
  const parts = body
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;
  return parts.map((part, idx) => (
    <p key={`${part}-${idx}`} className="text-sm sm:text-base text-[var(--vd-muted-fg)] leading-relaxed">
      {part}
    </p>
  ));
}

export function LegalDocument(props: LegalDocumentProps) {
  const sections = props.sections || [];
  const hasHeader = Boolean(props.title || props.lastUpdated);
  const hasSections = sections.some((section) => section.heading || section.body);

  if (!hasHeader && !hasSections) return null;

  return (
    <section className="px-6 sm:px-12 mb-20 max-w-4xl mx-auto">
      {hasHeader ? (
        <div className="mb-10">
          {props.title ? (
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-[var(--vd-fg)]">
              {props.title}
            </h1>
          ) : null}
          {props.lastUpdated ? (
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[var(--vd-muted-fg)]">
              Last updated: {props.lastUpdated}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-8">
        {sections.map((section, idx) => {
          if (!section.heading && !section.body) return null;
          return (
            <div key={`${section.heading || 'section'}-${idx}`} className="space-y-3">
              {section.heading ? (
                <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-[var(--vd-fg)]">
                  {section.heading}
                </h2>
              ) : null}
              {renderBody(section.body)}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export const legalDocumentConfig: ComponentConfig<LegalDocumentProps> = {
  fields: {
    title: { type: 'text' },
    lastUpdated: { type: 'text' },
    sections: {
      type: 'array',
      arrayFields: {
        heading: { type: 'text' },
        body: { type: 'textarea' }
      }
    }
  },
  defaultProps: {
    title: '',
    lastUpdated: '',
    sections: []
  },
  render: (props) => LegalDocument(props) as any
};
