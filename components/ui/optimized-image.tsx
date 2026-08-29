/* eslint-disable @next/next/no-img-element */
import * as React from 'react';
import Image from 'next/image';
import { resolveAssetImageUrl, type AssetImageOptions } from '@/lib/uploads';

const OPTIMIZABLE_REMOTE_HOSTS = new Set([
  'img.youtube.com',
  'i.ytimg.com',
  'images.unsplash.com'
]);

type BaseProps = {
  src?: string | null;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  loading?: 'eager' | 'lazy';
  decoding?: 'async' | 'sync' | 'auto';
  fetchPriority?: 'high' | 'low' | 'auto';
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
  onError?: React.ReactEventHandler<HTMLImageElement>;
  onClick?: React.MouseEventHandler<HTMLImageElement>;
  onPointerDownCapture?: React.PointerEventHandler<HTMLImageElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLImageElement>;
  tabIndex?: number;
  role?: React.AriaRole;
  'aria-label'?: string;
  'data-puck-overlay-portal'?: boolean;
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
export const OptimizedImage = React.forwardRef<HTMLImageElement, OptimizedImageProps>(function OptimizedImage(props, ref) {
  const {
    src,
    alt,
    className,
    style,
    sizes,
    priority,
    quality,
    loading,
    decoding,
    fetchPriority,
    referrerPolicy,
    onError,
    onClick,
    onPointerDownCapture,
    onKeyDown,
    tabIndex,
    role,
    'aria-label': ariaLabel,
    'data-puck-overlay-portal': puckOverlayPortal,
    imageOptions
  } = props;
  const safeSrc = src || '';
  const resolved = resolveAssetImageUrl(safeSrc, imageOptions);

  if (!safeSrc || !isOptimizable(resolved)) {
    const dimProps = props.fill
      ? {}
      : { width: props.width, height: props.height };
    return (
      <img
        ref={ref}
        src={resolved || undefined}
        alt={alt}
        className={className}
        style={style}
        loading={loading ?? (priority ? 'eager' : 'lazy')}
        fetchPriority={fetchPriority ?? (priority ? 'high' : undefined)}
        decoding={decoding ?? 'async'}
        referrerPolicy={referrerPolicy}
        onError={onError}
        onClick={onClick}
        onPointerDownCapture={onPointerDownCapture}
        onKeyDown={onKeyDown}
        tabIndex={tabIndex}
        role={role}
        aria-label={ariaLabel}
        data-puck-overlay-portal={puckOverlayPortal}
        {...dimProps}
      />
    );
  }

  if (props.fill) {
    return (
      <Image
        ref={ref}
        src={resolved}
        alt={alt}
        fill
        className={className}
        style={style}
        sizes={sizes || '100vw'}
        priority={priority}
        quality={quality}
        loading={priority ? undefined : loading}
        decoding={decoding}
        fetchPriority={fetchPriority}
        referrerPolicy={referrerPolicy}
        onError={onError}
        onClick={onClick}
        onPointerDownCapture={onPointerDownCapture}
        onKeyDown={onKeyDown}
        tabIndex={tabIndex}
        role={role}
        aria-label={ariaLabel}
        data-puck-overlay-portal={puckOverlayPortal}
      />
    );
  }

  return (
    <Image
      ref={ref}
      src={resolved}
      alt={alt}
      width={props.width}
      height={props.height}
      className={className}
      style={style}
      sizes={sizes}
      priority={priority}
      quality={quality}
      loading={priority ? undefined : loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      referrerPolicy={referrerPolicy}
      onError={onError}
      onClick={onClick}
      onPointerDownCapture={onPointerDownCapture}
      onKeyDown={onKeyDown}
      tabIndex={tabIndex}
      role={role}
      aria-label={ariaLabel}
      data-puck-overlay-portal={puckOverlayPortal}
    />
  );
});
