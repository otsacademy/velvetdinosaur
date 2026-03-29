import type { Article } from '@/lib/articles'
import { Gallery29 } from '@/components/gallery29'
import { getWorkFixtureBySlug } from '@/lib/work-fixtures'

const SELECTED_WORK_SLUGS = [
  'academics-stand-against-poverty',
  'the-brave',
  'rising-dust-adventures',
  'scholardemia',
] as const

function getSelectedWorkItems(): Article[] {
  return SELECTED_WORK_SLUGS.map((slug) => getWorkFixtureBySlug(slug)).filter((article): article is Article => Boolean(article))
}

export function SelectedWork() {
  return <Gallery29 items={getSelectedWorkItems()} />
}
