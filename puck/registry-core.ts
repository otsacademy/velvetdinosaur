import type { Config, Field, PuckComponent } from '@measured/puck';
import { createElement, type CSSProperties, type ReactNode } from 'react';
import { HeroBlock, type HeroBlockProps } from '@/components/blocks/hero';
import { FeatureGridBlock, type FeatureGridBlockProps } from '@/components/blocks/feature-grid';
import { TextBlock, type TextBlockProps } from '@/components/blocks/text-block';
import { ImageBlock, type ImageBlockProps } from '@/components/blocks/image-block';
import { CTAStrip, type CTAStripProps } from '@/components/blocks/cta-strip';
import { AttachmentBlock, type AttachmentBlockProps } from '@/components/blocks/attachment';

type LayoutProps = {
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  maxWidth?: 'full' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  align?: 'left' | 'center' | 'right';
  background?: 'none' | 'muted' | 'accent' | 'primary' | 'card';
  wrapperClassName?: string;
};

const layoutField: Field = {
  type: 'object',
  objectFields: {
    paddingTop: { type: 'number' },
    paddingRight: { type: 'number' },
    paddingBottom: { type: 'number' },
    paddingLeft: { type: 'number' },
    marginTop: { type: 'number' },
    marginRight: { type: 'number' },
    marginBottom: { type: 'number' },
    marginLeft: { type: 'number' },
    maxWidth: {
      type: 'select',
      options: [
        { label: 'Full', value: 'full' },
        { label: 'Small', value: 'sm' },
        { label: 'Medium', value: 'md' },
        { label: 'Large', value: 'lg' },
        { label: 'XL', value: 'xl' },
        { label: '2XL', value: '2xl' }
      ]
    },
    align: {
      type: 'select',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' }
      ]
    },
    background: {
      type: 'select',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Muted', value: 'muted' },
        { label: 'Accent', value: 'accent' },
        { label: 'Primary', value: 'primary' },
        { label: 'Card', value: 'card' }
      ]
    },
    wrapperClassName: { type: 'text' }
  }
};

const defaultLayout: LayoutProps = {
  paddingTop: 0,
  paddingRight: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  marginTop: 0,
  marginRight: 0,
  marginBottom: 0,
  marginLeft: 0,
  maxWidth: 'full',
  align: 'left',
  background: 'none',
  wrapperClassName: ''
};

function applyLayout(node: ReactNode, layout?: LayoutProps) {
  if (!layout) return node;
  const style: CSSProperties = {};
  const numericPx = (value?: number) =>
    typeof value === 'number' && Number.isFinite(value) && value !== 0 ? `${value}px` : undefined;

  const paddingTop = numericPx(layout.paddingTop);
  const paddingRight = numericPx(layout.paddingRight);
  const paddingBottom = numericPx(layout.paddingBottom);
  const paddingLeft = numericPx(layout.paddingLeft);
  const marginTop = numericPx(layout.marginTop);
  const marginRight = numericPx(layout.marginRight);
  const marginBottom = numericPx(layout.marginBottom);
  const marginLeft = numericPx(layout.marginLeft);

  if (paddingTop) style.paddingTop = paddingTop;
  if (paddingRight) style.paddingRight = paddingRight;
  if (paddingBottom) style.paddingBottom = paddingBottom;
  if (paddingLeft) style.paddingLeft = paddingLeft;

  if (marginTop) style.marginTop = marginTop;
  if (marginRight) style.marginRight = marginRight;
  if (marginBottom) style.marginBottom = marginBottom;
  if (marginLeft) style.marginLeft = marginLeft;

  if (layout.align) style.textAlign = layout.align;

  if (layout.maxWidth && layout.maxWidth !== 'full') {
    const widthMap: Record<string, number> = {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536
    };
    style.maxWidth = `${widthMap[layout.maxWidth] || 1024}px`;
    if (!marginLeft) style.marginLeft = 'auto';
    if (!marginRight) style.marginRight = 'auto';
  }

  if (layout.background && layout.background !== 'none') {
    const bgMap: Record<string, string> = {
      muted: 'var(--vd-muted)',
      accent: 'var(--vd-accent)',
      primary: 'var(--vd-primary)',
      card: 'rgba(255,255,255,0.7)'
    };
    style.background = bgMap[layout.background] || 'transparent';
  }

  const className = layout.wrapperClassName || '';
  if (Object.keys(style).length === 0 && !className) return node;
  return createElement('div', { style, className }, node);
}

type ComponentConfigLike = {
  fields?: Record<string, unknown>;
  defaultProps?: Record<string, unknown>;
  render?: (props: Record<string, unknown>) => ReactNode;
};

export function withLayout<T>(component: T): T {
  const config = component as unknown as ComponentConfigLike;
  if (!config || typeof config !== 'object') return component;
  const render = config.render;
  if (typeof render !== 'function') return component;

  const fields = (config.fields as Record<string, unknown>) || {};
  const defaultProps = (config.defaultProps as Record<string, unknown>) || {};

  const nextFields = (fields as Record<string, unknown>).layout
    ? fields
    : { ...fields, layout: layoutField };
  const nextDefaultProps =
    (defaultProps as Record<string, unknown>).layout && typeof defaultProps.layout === 'object'
      ? defaultProps
      : { ...defaultProps, layout: defaultLayout };

  const nextRender = (props: Record<string, unknown>) => {
    const { layout, ...rest } = props || {};
    return applyLayout(render(rest), layout as LayoutProps | undefined);
  };

  return {
    ...(component as object),
    fields: nextFields,
    defaultProps: nextDefaultProps,
    render: nextRender
  } as T;
}

const renderHero: PuckComponent<HeroBlockProps> = (props) =>
  HeroBlock({
    eyebrow: props.eyebrow,
    title: props.title,
    subtitle: props.subtitle,
    primaryLabel: props.primaryLabel,
    secondaryLabel: props.secondaryLabel,
    primaryLink: props.primaryLink,
    secondaryLink: props.secondaryLink
  });

const renderFeatureGrid: PuckComponent<FeatureGridBlockProps> = (props) =>
  FeatureGridBlock({ heading: props.heading, items: props.items });

const renderTextBlock: PuckComponent<TextBlockProps> = (props) =>
  TextBlock({ heading: props.heading, body: props.body });

const renderImageBlock: PuckComponent<ImageBlockProps> = (props) =>
  ImageBlock({
    src: props.src,
    alt: props.alt,
    caption: props.caption,
    loading: props.loading,
    fetchPriority: props.fetchPriority
  });

const renderCTAStrip: PuckComponent<CTAStripProps> = (props) =>
  CTAStrip({
    title: props.title,
    subtitle: props.subtitle,
    buttonLabel: props.buttonLabel,
    buttonLink: props.buttonLink
  });

const renderAttachment: PuckComponent<AttachmentBlockProps> = (props) =>
  AttachmentBlock({ label: props.label, fileUrl: props.fileUrl });

export const coreComponents: Config['components'] = {
  Hero: {
    fields: {
      eyebrow: { type: 'text', contentEditable: true },
      title: { type: 'text', contentEditable: true },
      subtitle: { type: 'textarea', contentEditable: true },
      primaryLabel: { type: 'text', contentEditable: true },
      primaryLink: {
        type: 'object',
        objectFields: {
          href: { type: 'text' },
          target: {
            type: 'select',
            options: [
              { label: 'Same tab', value: '_self' },
              { label: 'New tab', value: '_blank' }
            ]
          },
          rel: { type: 'text' }
        }
      },
      secondaryLabel: { type: 'text', contentEditable: true },
      secondaryLink: {
        type: 'object',
        objectFields: {
          href: { type: 'text' },
          target: {
            type: 'select',
            options: [
              { label: 'Same tab', value: '_self' },
              { label: 'New tab', value: '_blank' }
            ]
          },
          rel: { type: 'text' }
        }
      }
    },
    defaultProps: {
      eyebrow: 'Velvet Dinosaur',
      title: 'Design-forward websites in days, not months.',
      subtitle:
        'A modular Puck-powered system with shadcn components, Tailwind 4 tokens, and R2 storage baked in.',
      primaryLabel: 'Launch now',
      primaryLink: {
        href: '',
        target: '_self',
        rel: ''
      },
      secondaryLabel: 'View blocks',
      secondaryLink: {
        href: '',
        target: '_self',
        rel: ''
      }
    },
    render: renderHero
  },
  FeatureGrid: {
    fields: {
      heading: { type: 'text', contentEditable: true },
      items: {
        type: 'array',
        arrayFields: {
          title: { type: 'text', contentEditable: true },
          description: { type: 'textarea', contentEditable: true },
          icon: {
            type: 'select',
            options: [
              { label: 'Sparkles', value: 'sparkles' },
              { label: 'Layers', value: 'layers' },
              { label: 'Shield', value: 'shield' }
            ]
          }
        }
      }
    },
    defaultProps: {
      heading: 'Everything you need to ship fast',
      items: [
        {
          title: 'Puck-ready blocks',
          description: 'All blocks are shadcn-based and editor-safe.',
          icon: 'sparkles'
        },
        {
          title: 'Design tokens',
          description: 'OKLCH tokens editable from the admin panel.',
          icon: 'layers'
        },
        {
          title: 'Secure by default',
          description: 'BetterAuth + per-site Mongo users + R2 uploads.',
          icon: 'shield'
        }
      ]
    },
    render: renderFeatureGrid
  },
  Text: {
    fields: {
      heading: { type: 'text', contentEditable: true },
      body: { type: 'textarea', contentEditable: true }
    },
    defaultProps: {
      heading: 'Make it yours',
      body: 'Swap blocks, edit copy, and publish instantly. Everything persists in MongoDB so you can version and roll back.'
    },
    render: renderTextBlock
  },
  Image: {
    fields: {
      src: { type: 'text' },
      alt: { type: 'text' },
      caption: { type: 'text', contentEditable: true }
    },
    defaultProps: {
      src: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
      alt: 'Team collaborating',
      caption: 'Drop in R2-hosted assets or external images.'
    },
    render: renderImageBlock
  },
  CTA: {
    fields: {
      title: { type: 'text', contentEditable: true },
      subtitle: { type: 'text', contentEditable: true },
      buttonLabel: { type: 'text', contentEditable: true },
      buttonLink: {
        type: 'object',
        objectFields: {
          href: { type: 'text' },
          target: {
            type: 'select',
            options: [
              { label: 'Same tab', value: '_self' },
              { label: 'New tab', value: '_blank' }
            ]
          },
          rel: { type: 'text' }
        }
      }
    },
    defaultProps: {
      title: 'Ready to ship your next site?',
      subtitle: 'Spin up another site in minutes with the same core stack.',
      buttonLabel: 'Create a new site',
      buttonLink: {
        href: '',
        target: '_self',
        rel: ''
      }
    },
    render: renderCTAStrip
  },
  Attachment: {
    fields: {
      label: { type: 'text', contentEditable: true },
      fileUrl: { type: 'text' }
    },
    defaultProps: {
      label: 'Download file',
      fileUrl: ''
    },
    render: renderAttachment
  }
};
