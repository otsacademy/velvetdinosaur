import type { ArticleAuthorProfile } from '@/lib/articles'

type SessionLike = {
  user?: {
    id?: string | null
    name?: string | null
    image?: string | null
    email?: string | null
  } | null
}

export async function getUserProfileByUserId(_userId: string | null) {
  return null as ArticleAuthorProfile | null
}

export async function resolveAuthorIdentity(
  session: SessionLike | null,
  overrides: { name?: string; image?: string } = {},
) {
  const user = session?.user
  return {
    userId: user?.id || null,
    name: overrides.name?.trim() || user?.name?.trim() || 'Velvet Dinosaur',
    image: overrides.image?.trim() || user?.image?.trim() || '/dinosaur.webp',
  }
}
