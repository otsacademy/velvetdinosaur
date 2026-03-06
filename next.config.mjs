import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enableStorePreview =
  process.env.NODE_ENV !== 'production' || process.env.VD_ENABLE_STORE_PREVIEW === 'true';
const enablePuckContentPreviews =
  process.env.NODE_ENV !== 'production' ||
  process.env.VD_ENABLE_PUCK_CONTENT_PREVIEWS === 'true';
const distDir = process.env.NEXT_DIST_DIR?.trim();
const previewAliasesTurbopack = {
  ...(enableStorePreview
    ? {}
    : {
        '@/components/admin/store/preview-registry':
          './components/admin/store/preview-registry.stub.ts'
      }),
  ...(enablePuckContentPreviews
    ? {}
    : {
        '@/components/puck/previews': './components/puck/previews/index.stub.tsx'
      })
};
const previewAliasesWebpack = {
  ...(enableStorePreview
    ? {}
    : {
        '@/components/admin/store/preview-registry': path.join(
          __dirname,
          'components/admin/store/preview-registry.stub.ts'
        )
      }),
  ...(enablePuckContentPreviews
    ? {}
    : {
        '@/components/puck/previews': path.join(
          __dirname,
          'components/puck/previews/index.stub.tsx'
        )
      })
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(distDir ? { distDir } : {}),
  cacheComponents: true,
  reactStrictMode: true,
  async redirects() {
    return [{ source: '/home', destination: '/', permanent: true }];
  },
  async headers() {
    const noStore = [
      {
        key: 'Cache-Control',
        value: 'private, no-cache, no-store, max-age=0, must-revalidate'
      },
      { key: 'Pragma', value: 'no-cache' },
      { key: 'Expires', value: '0' },
      { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }
    ];
    return [
      { source: '/edit', headers: noStore },
      { source: '/edit/:path*', headers: noStore },
      { source: '/admin', headers: noStore },
      { source: '/admin/:path*', headers: noStore },
      { source: '/preview', headers: noStore },
      { source: '/preview/:path*', headers: noStore }
    ];
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    unoptimized: true,
    localPatterns: [{ pathname: '/**' }],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'yt3.ggpht.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }
    ]
  },
  turbopack: {
    resolveAlias: previewAliasesTurbopack
  },
  webpack(config) {
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    Object.assign(config.resolve.alias, previewAliasesWebpack);

    return config;
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  }
};

export default nextConfig;
