import type { Metadata } from 'next';
import { BusinessReviewsDirectory } from '@/components/business-reviews/business-reviews-directory.client';
import { DesignShell } from '@/components/home/design-shell';
import { siteName } from '@/lib/site-metadata';

const description = 'Find independent businesses and read their latest Google and Tripadvisor reviews in one simple place.';

export const metadata: Metadata = {
  title: 'Business Reviews',
  description,
  alternates: { canonical: '/business-reviews' },
  openGraph: {
    type: 'website',
    url: '/business-reviews',
    siteName,
    title: `Business Reviews | ${siteName}`,
    description
  }
};

export default function BusinessReviewsPage() {
  const tripadvisorWidgetsEnabled = process.env.TRIPADVISOR_WIDGETS_ENABLED === 'true';

  return (
    <DesignShell>
      <section className="border-b border-[var(--vd-border)] bg-[var(--vd-bg)]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-[var(--vd-primary)]">Local recommendations</p>
          <h1 className="max-w-3xl text-balance text-4xl font-extrabold tracking-[-0.035em] text-[var(--vd-fg)] md:text-5xl">
            Real reviews, kept close to their source.
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-[var(--vd-muted-fg)] md:text-lg">
            Explore businesses through current Google reviews and official Tripadvisor listings. Each source stays clearly labelled, with a direct link to read more.
          </p>
        </div>
      </section>
      <section className="bg-[var(--vd-muted)]/35">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
          <BusinessReviewsDirectory
            tripadvisorWidgetsEnabled={tripadvisorWidgetsEnabled}
          />
        </div>
      </section>
      <section className="border-t border-[var(--vd-border)] bg-[var(--vd-bg)]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-12 lg:px-8">
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--vd-fg)]">How this review page works</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="font-bold text-[var(--vd-fg)]">Google loads on request</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--vd-muted-fg)]">Google supplies up to five relevant reviews only after you choose to show them. Velvet Dinosaur stores the business ID, not the returned review content.</p>
            </div>
            <div>
              <h3 className="font-bold text-[var(--vd-fg)]">Sources stay separate</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--vd-muted-fg)]">Every review area names its provider and links back to the original listing, so you can check the source and read the complete set of reviews.</p>
            </div>
            <div>
              <h3 className="font-bold text-[var(--vd-fg)]">Tripadvisor stays official</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--vd-muted-fg)]">Tripadvisor links open the official business listing. Its widget is used only when the website is eligible under Tripadvisor’s widget terms.</p>
            </div>
          </div>
        </div>
      </section>
    </DesignShell>
  );
}
