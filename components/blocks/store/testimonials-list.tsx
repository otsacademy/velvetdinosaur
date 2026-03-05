/* eslint-disable @next/next/no-img-element */
import type { ComponentConfig } from '@measured/puck';
import { Leaf, Star } from 'lucide-react';
import { listReviews } from '@/lib/content/reviews';
import type { Review } from '@/lib/content/types';
import { cn } from '@/lib/utils';

export type TestimonialsListProps = {
  title?: string;
  lead?: string;
  mode?: 'all' | 'ids';
  reviewIds?: string[];
  columns?: number;
  showFeatured?: boolean | 'true' | 'false';
  featuredSlug?: string;
};

function getInitial(name?: string) {
  if (!name) return '?';
  return name.trim().charAt(0).toUpperCase();
}

function getRating(review: Review) {
  if (typeof review.rating !== 'number') return undefined;
  const rounded = Math.round(review.rating);
  return Math.max(0, Math.min(5, rounded));
}

function pickFeatured(reviews: Review[], slug?: string) {
  if (slug) return reviews.find((review) => review.slug === slug);
  return reviews.find((review) => review.source === 'testimonial' || review.highlight);
}

export async function TestimonialsList(props: TestimonialsListProps) {
  const all = await listReviews();
  const selected =
    props.mode === 'ids' && props.reviewIds?.length
      ? all.filter((review) => props.reviewIds!.includes(review.slug))
      : all;

  const featured = pickFeatured(selected, props.featuredSlug);
  const showFeatured =
    props.showFeatured === true || props.showFeatured === 'true'
      ? true
      : props.showFeatured === 'false'
        ? false
        : Boolean(featured);

  const gridReviews = selected.filter(
    (review) => review.source === 'linkedin' || review.source === 'google'
  );
  const columns = Math.min(Math.max(props.columns || 2, 1), 2);
  const columnClass = columns === 1 ? 'lg:grid-cols-1' : 'lg:grid-cols-2';

  return (
    <section className="px-6 sm:px-12 pt-12 pb-20 max-w-7xl mx-auto">
      <div className="mb-12 space-y-3">
        <h1 className="text-4xl sm:text-5xl font-display font-black text-[var(--vd-fg)] tracking-tight">
          {props.title || 'Reviews'}
        </h1>
        {props.lead ? <p className="text-sm text-[var(--vd-muted-fg)] max-w-2xl">{props.lead}</p> : null}
      </div>

      <div className={cn('grid grid-cols-1 gap-8 mb-20', columnClass)}>
        {gridReviews.length === 0 ? (
          <p className="text-sm text-[var(--vd-muted-fg)]">No public reviews yet.</p>
        ) : (
          gridReviews.map((review) => {
            const isGoogle = review.source === 'google';
            const rating = isGoogle ? getRating(review) : undefined;
            return (
            <article
              key={review.slug}
              className="bg-white border border-[var(--vd-border)] rounded-2xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-[var(--vd-primary)]/30 transition-all duration-300"
            >
              <div className="flex items-start gap-4 mb-6">
                {review.avatar ? (
                  <img
                    src={review.avatar}
                    alt={review.author}
                    className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[var(--vd-muted)] text-[var(--vd-fg)] flex items-center justify-center font-black shadow-md">
                    {getInitial(review.author)}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[var(--vd-fg)]">{review.author}</h3>
                    <span className="text-[var(--vd-muted-fg)] text-xs font-bold">
                      {isGoogle ? 'Google' : '• 1st'}
                    </span>
                  </div>
                  {review.role ? (
                    <p className="text-sm text-[var(--vd-muted-fg)] line-clamp-1 font-medium">{review.role}</p>
                  ) : null}
                  <div className="flex items-center gap-1 text-xs font-bold text-[var(--vd-muted-fg)] mt-1 uppercase tracking-wider">
                    {review.dateLabel ? <span>{review.dateLabel}</span> : null}
                    {review.dateLabel ? <span>•</span> : null}
                    {isGoogle && rating ? (
                      <span
                        className="flex items-center gap-0.5 text-[var(--vd-accent)]"
                        aria-label={`${rating} star rating`}
                      >
                        {[...Array(5)].map((_, index) => (
                          <Star
                            key={index}
                            className={cn(
                              'h-3 w-3',
                              index < rating
                                ? 'fill-[var(--vd-accent)] text-[var(--vd-accent)]'
                                : 'text-[var(--vd-muted)]'
                            )}
                          />
                        ))}
                      </span>
                    ) : (
                      <Leaf className="h-3 w-3" />
                    )}
                  </div>
                </div>
              </div>
              <div className="text-base text-[var(--vd-fg)]/80 whitespace-pre-wrap leading-relaxed">
                {review.content}
              </div>
            </article>
            );
          })
        )}
      </div>

      {showFeatured && featured ? (
        <div className="bg-white border border-[var(--vd-border)] rounded-[2rem] p-10 shadow-lg hover:shadow-2xl transition-all duration-500 mb-20 max-w-5xl mx-auto relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
            <Star className="h-10 w-10" />
          </div>
          <div className="flex items-start gap-5 mb-8 relative z-10">
            <div className="w-16 h-16 rounded-full bg-[var(--vd-muted)] flex items-center justify-center text-[var(--vd-primary)] font-bold text-2xl shadow-inner">
              {getInitial(featured.author)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--vd-fg)]">{featured.author}</h3>
              {featured.role ? (
                <p className="text-sm text-[var(--vd-muted-fg)] font-medium">{featured.role}</p>
              ) : null}
              {featured.dateLabel ? (
                <p className="text-xs text-[var(--vd-muted-fg)] mt-1 font-bold uppercase tracking-wider">
                  {featured.dateLabel}
                </p>
              ) : null}
            </div>
          </div>
          <div className="text-lg text-[var(--vd-fg)]/80 whitespace-pre-wrap leading-relaxed font-display relative z-10">
            {featured.content}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export const testimonialsListConfig: ComponentConfig<TestimonialsListProps> = {
  fields: {
    title: { type: 'text' },
    lead: { type: 'textarea' },
    mode: {
      type: 'select',
      options: [
        { label: 'All reviews', value: 'all' },
        { label: 'Select by slug', value: 'ids' }
      ]
    },
    reviewIds: { type: 'array', arrayFields: { value: { type: 'text' } } },
    columns: { type: 'number' },
    showFeatured: {
      type: 'select',
      options: [
        { label: 'Show featured', value: 'true' },
        { label: 'Hide featured', value: 'false' }
      ]
    },
    featuredSlug: { type: 'text' }
  },
  defaultProps: {
    title: 'Reviews',
    lead: 'Kind words from collaborators, students, and stay guests.',
    mode: 'all',
    columns: 2,
    showFeatured: true
  },
  render: (props) => TestimonialsList(props) as any
};
