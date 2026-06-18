/* eslint-disable @next/next/no-img-element */
import Image from 'next/image';
import { resolveAssetImageUrl, type AssetImageOptions } from '@/lib/uploads';

type BaseProps = {
  src?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  preload?: boolean;
  priority?: boolean;
  quality?: number;
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
    // Only same-allowlisted hosts are safe; be conservative and let <img> handle
    // arbitrary external URLs. Relative (/api/assets/file, /assets/...) are fine.
    return false;
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
  const { src, alt, className, sizes, preload, priority, quality, imageOptions } = props;
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
        loading={shouldPreload ? 'eager' : 'lazy'}
        fetchPriority={shouldPreload ? 'high' : undefined}
        decoding="async"
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
        sizes={sizes || '100vw'}
        preload={shouldPreload || undefined}
        quality={quality}
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
      sizes={sizes}
      preload={shouldPreload || undefined}
      quality={quality}
    />
  );
}
