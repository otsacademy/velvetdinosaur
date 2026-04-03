import type { Article } from '@/lib/articles'
import { ShadcnblocksGallery16 } from '@/components/blocks/store/shadcnblocks/gallery16'
import { listLatestPublishedWorkArticles } from '@/lib/work-articles.server'

function mapArticleToGalleryItem(article: Article) {
  const secondaryTag = article.tags?.find((tag) => tag !== article.tag) || article.readTime || article.date
  const hasSubtitle = Boolean(article.subtitle && article.subtitle.trim() && article.subtitle !== article.desc)
  const category = secondaryTag || article.tag || article.title

  return {
    category,
    eyebrow: article.website ? 'Live project' : 'Case study',
    title: article.title,
    description: hasSubtitle ? article.subtitle! : article.desc,
    descriptionSecondary: hasSubtitle ? article.desc : undefined,
    bullets: article.outcome ? [`Outcome: ${article.outcome}`] : [],
    note: article.tag && article.tag !== category ? article.tag : 'Real project',
    image: article.img || '/placeholder.svg',
    imageAlt: article.imageCaption || article.title,
    primaryLabel: 'Read case study',
    primaryHref: `/work/${article.slug}`,
    secondaryLabel: article.website ? 'Visit site' : undefined,
    secondaryHref: article.website,
  }
}

export async function SelectedWork() {
  const workItems = await listLatestPublishedWorkArticles(4)

  return (
    <section id="portfolio" className="py-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-8 space-y-3 md:mb-10">
          <h2 className="vd-section-heading text-2xl font-semibold tracking-tight md:text-[2.2rem]">
            Selected work
          </h2>
          <p className="max-w-2xl text-[15px] leading-relaxed text-[var(--vd-copy)]">
            Real projects across charities, service businesses, and product platforms.
          </p>
        </div>
      </div>
      <ShadcnblocksGallery16
        items={workItems.map(mapArticleToGalleryItem)}
        containerClassName="max-w-6xl"
        sectionClassName="py-0"
      />
    </section>
  )
}
