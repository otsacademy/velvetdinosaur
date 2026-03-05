/* eslint-disable @next/next/no-img-element */
import type { ComponentConfig } from '@measured/puck';
import { Play, Star } from 'lucide-react';
import { listReviews } from '@/lib/content/reviews';
import type { Review } from '@/lib/content/types';
import { cn } from '@/lib/utils';

export type GuestNotesProps = {
  title?: string;
  lead?: string;
  mode?: 'all' | 'ids';
  reviewIds?: string[];
};

function pickBySource(reviews: Review[], source: Review['source']) {
  return reviews.find((review) => review.source === source);
}

export async function GuestNotes(props: GuestNotesProps) {
  const all = await listReviews();
  const selected =
    props.mode === 'ids' && props.reviewIds?.length
      ? all.filter((review) => props.reviewIds!.includes(review.slug))
      : all;

  const note = pickBySource(selected, 'note');
  const phone = pickBySource(selected, 'phone');

  return (
    <section className="px-6 sm:px-12 pb-20 max-w-7xl mx-auto">
      {(props.title || props.lead) && (
        <div className="mb-10">
          {props.title ? (
            <h2 className="text-3xl font-black uppercase tracking-tighter text-[var(--vd-fg)] mb-2">
              {props.title}
            </h2>
          ) : null}
          {props.lead ? <p className="text-sm text-[var(--vd-muted-fg)] max-w-2xl">{props.lead}</p> : null}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="relative group rotate-1 hover:rotate-0 transition-transform duration-500">
          <div className="bg-[var(--vd-bg)] p-10 md:p-14 shadow-2xl rounded-xl border border-[var(--vd-border)] relative overflow-hidden min-h-[520px] flex flex-col font-display">
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(var(--vd-muted-fg) 0.5px, transparent 0.5px)',
                backgroundSize: '20px 20px'
              }}
            />
            <p className="text-2xl md:text-3xl text-[var(--vd-fg)] leading-relaxed italic relative z-10 whitespace-pre-wrap">
              {note?.content || 'No guest note yet.'}
            </p>

            <div className="absolute bottom-10 right-10 transform rotate-[-5deg]">
              <div className="bg-white px-6 py-4 rounded-full shadow-lg border border-[var(--vd-border)]">
                <p className="text-sm font-bold text-[var(--vd-fg)]">
                  what a lovely review
                  <br />
                  from the guests
                </p>
              </div>
              <div className="w-4 h-4 bg-white absolute -bottom-1 -right-1 rotate-45 border-r border-b border-[var(--vd-border)]" />
            </div>
          </div>
        </div>

        <div className="relative group -rotate-1 hover:rotate-0 transition-transform duration-500 flex justify-center items-center">
          <div className="bg-[var(--vd-fg)] text-white p-6 md:p-8 rounded-[3rem] shadow-2xl max-w-md w-full border-[8px] border-[var(--vd-fg)] relative h-[600px] flex flex-col">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-[var(--vd-fg)] rounded-b-xl z-20" />

            <div className="mt-8 space-y-6 h-full flex flex-col px-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[var(--vd-primary)] flex items-center justify-center text-sm font-bold shadow-lg">
                  {phone?.author?.charAt(0) || 'N'}
                </div>
                <div>
                  <p className="text-base font-bold">{phone?.author || "Nona's House"}</p>
                  <div className="flex text-[var(--vd-accent)] gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-3 w-3" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-base leading-relaxed text-white/80 font-medium whitespace-pre-wrap">
                {phone?.content || 'No phone review available yet.'}
              </p>
              <div className="mt-auto pt-6 flex justify-between items-center text-xs font-bold text-white/40 uppercase tracking-widest border-t border-white/10">
                <span>0:00 / 0:11</span>
                <Play className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export const guestNotesConfig: ComponentConfig<GuestNotesProps> = {
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
    reviewIds: { type: 'array', arrayFields: { value: { type: 'text' } } }
  },
  defaultProps: {
    title: '',
    lead: '',
    mode: 'all'
  },
  render: (props) => GuestNotes(props) as any
};
