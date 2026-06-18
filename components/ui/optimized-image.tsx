/* eslint-disable @next/next/no-img-element */
import type React from 'react';
import Image from 'next/image';
import { resolveAssetImageUrl, type AssetImageOptions } from '@/lib/uploads';

const configuredR2Host = (() => {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE;
  if (!base) return null;
  try {
    return new URL(base).hostname;
  } catch {
    return null;
  }
})();

const OPTIMIZABLE_REMOTE_HOSTS = new Set([
  ...(configuredR2Host ? [configuredR2Host] : []),
  'images.unsplash.com',
  'img.youtube.com',
  'i.ytimg.com',
  'yt3.ggpht.com',
  'lh3.googleusercontent.com'
]);

type BaseProps = {
  src?: string | null;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  sizes?: string;
  preload?: boolean;
  priority?: boolean;
  quality?: number;
  loading?: 'eager' | 'lazy';
  decoding?: 'async' | 'sync' | 'auto';
  fetchPriority?: 'high' | 'low' | 'auto';
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
  onError?: React.ReactEventHandler<HTMLImageElement>;
  /** Resize hint passed to resolveAssetImageUrl (and used for fixed-size rendering). */
  imageOptions?: AssetImageOptions;
};

type FillProps = BaseProps & { fill: true; width?: never; height?: never };
type FixedProps = BaseProps & { fill?: false; width: number; height: number };

export type OptimizedImageProps = FillProps | FixedProps;

// next/image cannot optimize inline (data:/blob:) or unknown external srcs without
// remotePatterns. For those we fall back to a plain <img> so rendering never breaks.
function isOptimizable(src: string) {
  if (!src) return false;
  if (src.startsWith('data:') || src.startsWith('blob:')) return false;
  // SVGs are vector — next/image gives no benefit and would need dangerouslyAllowSVG.
  if (/\.svg(\?|$)/i.test(src)) return false;
  if (src.startsWith('http://') || src.startsWith('https://')) {
    try {
      return OPTIMIZABLE_REMOTE_HOSTS.has(new URL(src).hostname);
    } catch {
      return false;
    }
  }
  return true;
}

/**
 * Public-facing image renderer. Routes the src through resolveAssetImageUrl (CDN/no-op)
 * and serves it via next/image so it is resized + re-encoded to AVIF/WebP on the way out.
 * Falls back to <img> for inline/external srcs that next/image cannot optimize.
 *
 * Use `fill` for images that fill a positioned (relative) parent — the common case for
 * object-cover layouts — or `width`/`height` for fixed-size images (avatars, logos).
 */
export function OptimizedImage(props: OptimizedImageProps) {
  const {
    src,
    alt,
    className,
    style,
    sizes,
    preload,
    priority,
    quality,
    loading,
    decoding,
    fetchPriority,
    referrerPolicy,
    onError,
    imageOptions
  } = props;
  const safeSrc = src || '';
  const resolved = resolveAssetImageUrl(safeSrc, imageOptions);
  const shouldPreload = preload ?? priority ?? false;

  if (!safeSrc || !isOptimizable(resolved)) {
    const dimProps = props.fill
      ? {}
      : { width: props.width, height: props.height };
    return (
      <img
        src={resolved || undefined}
        alt={alt}
        className={className}
        style={style}
        loading={loading ?? (shouldPreload ? 'eager' : 'lazy')}
        fetchPriority={fetchPriority ?? (shouldPreload ? 'high' : undefined)}
        decoding={decoding ?? 'async'}
        referrerPolicy={referrerPolicy}
        onError={onError}
        {...dimProps}
      />
    );
  }

  if (props.fill) {
    return (
      <Image
        src={resolved}
        alt={alt}
        fill
        className={className}
        style={style}
        sizes={sizes || '100vw'}
        preload={shouldPreload || undefined}
        quality={quality}
        loading={shouldPreload ? undefined : loading}
        decoding={decoding}
        fetchPriority={fetchPriority}
        referrerPolicy={referrerPolicy}
        onError={onError}
      />
    );
  }

  return (
    <Image
      src={resolved}
      alt={alt}
      width={props.width}
      height={props.height}
      className={className}
      style={style}
      sizes={sizes}
      preload={shouldPreload || undefined}
      quality={quality}
      loading={shouldPreload ? undefined : loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      referrerPolicy={referrerPolicy}
      onError={onError}
    />
  );
}
