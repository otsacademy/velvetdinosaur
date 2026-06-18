type PortfolioImageRole = 'card' | 'hero' | 'snapshot'

const LEGACY_PORTFOLIO_REPLACEMENTS: Record<
  string,
  Record<PortfolioImageRole, string>
> = {
  '/portfolio/asap.png': {
    card: '/portfolio/asap-864w.avif',
    hero: '/portfolio/asap-1440w.avif',
    snapshot: '/portfolio/asap-864w.avif',
  },
  '/portfolio/the-brave.png': {
    card: '/portfolio/the-brave-864w.avif',
    hero: '/portfolio/the-brave-1440w.avif',
    snapshot: '/portfolio/the-brave-864w.avif',
  },
  '/portfolio/rising-dust.png': {
    card: '/portfolio/rising-dust-864w.avif',
    hero: '/portfolio/rising-dust-1440w.avif',
    snapshot: '/portfolio/rising-dust-864w.avif',
  },
  '/portfolio/scholardemia.png': {
    card: '/portfolio/scholardemia-864w.avif',
    hero: '/portfolio/scholardemia-1440w.avif',
    snapshot: '/portfolio/scholardemia-864w.avif',
  },
}

export function normalizePortfolioImageSrc(src: string, role?: PortfolioImageRole): string
export function normalizePortfolioImageSrc(src: null, role?: PortfolioImageRole): null
export function normalizePortfolioImageSrc(src: undefined, role?: PortfolioImageRole): undefined
export function normalizePortfolioImageSrc(src: string | null, role?: PortfolioImageRole): string | null
export function normalizePortfolioImageSrc(src: string | undefined, role?: PortfolioImageRole): string | undefined
export function normalizePortfolioImageSrc(
  src: string | undefined | null,
  role: PortfolioImageRole = 'card',
): string | undefined | null {
  if (!src) return src
  const match = src.match(/^([^?#]+)([?#].*)?$/)
  const pathname = match?.[1] || src
  const suffix = match?.[2] || ''
  const replacement = LEGACY_PORTFOLIO_REPLACEMENTS[pathname]?.[role]
  return replacement ? `${replacement}${suffix}` : src
}
