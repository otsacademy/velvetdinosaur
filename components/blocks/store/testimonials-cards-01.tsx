'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ComponentConfig } from '@measured/puck';
import { BadgeCheck, ExternalLink } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import type { Review } from '@/lib/content/types';

export type TestimonialCard = {
  image?: string;
  name: string;
  username?: string;
  quote: string;
  date?: string;
  verified?: boolean | string;
  linkHref?: string;
};

export type TestimonialsCards01Props = {
  id?: string;
  eyebrow?: string;
  heading?: string;
  description?: string;
  linkLabel?: string;
  source?: 'manual' | 'google' | 'all';
  reviewsLimit?: number;
  googleReviewsUrl?: string;
  testimonials: TestimonialCard[];
};

const DEFAULT_TESTIMONIALS: TestimonialCard[] = [
  {
    image:
      'https://images.unsplash.com/photo-1641906840000-4b88f1d44de6?auto=format&fit=crop&q=80&w=400&h=400',
    name: 'Jessica Devis',
    username: '@jessicadevis',
    quote:
      'The utility-first approach and extensive component library make it a breeze to create beautiful and responsive interfaces.',
    date: 'Jan 17, 2024',
    verified: 'true',
    linkHref: '#'
  },
  {
    image:
      'https://images.unsplash.com/photo-1716662318479-a9c0f1cd1a0e?auto=format&fit=crop&q=80&w=400&h=400',
    name: 'Lucian Eurel',
    username: '@lucianeurel',
    quote:
      "It's like having a superpower in your toolkit. The ability to craft custom designs quickly and efficiently with simple classes is unparalleled.",
    date: 'Jan 18, 2024',
    verified: 'true',
    linkHref: '#'
  },
  {
    image:
      'https://images.unsplash.com/photo-1623853434105-8e7a72898180?auto=format&fit=crop&q=80&w=400&h=400',
    name: 'Marcell Glock',
    username: '@marcelglock',
    quote:
      'The utility-first approach and extensive component library make it a breeze to create beautiful and responsive interfaces.',
    date: 'Jan 19, 2024',
    verified: 'true',
    linkHref: '#'
  },
  {
    image: 'https://v3.material-tailwind.com/man-profile-2.jpg',
    name: 'Linde Michele',
    username: '@lindemichele',
    quote:
      "With its clear and concise classes, I can easily communicate design intentions to my colleagues. It's a must-have tool for any web developer.",
    date: 'Jan 20, 2024',
    verified: 'true',
    linkHref: '#'
  },
  {
    image: 'https://v3.material-tailwind.com/man-profile-3.jpg',
    name: 'Mary Joshiash',
    username: '@maryjoshiash',
    quote:
      "I've tried several CSS frameworks, but this is on a whole different level. It strikes the perfect balance between flexibility and design.",
    date: 'Jan 21, 2024',
    verified: 'true',
    linkHref: '#'
  },
  {
    image: 'https://v3.material-tailwind.com/woman-profile-3.jpg',
    name: 'Misha Stam',
    username: '@mishastam',
    quote:
      "Active community support make it easy to get started. It's the ideal framework for achieving design excellence in web applications.",
    date: 'Jan 22, 2024',
    verified: 'true',
    linkHref: '#'
  }
];

const DEFAULT_REVIEWS_LIMIT = 6;

function getInitials(name?: string) {
  if (!name) return 'NA';
  return name
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function normalizeRating(value?: number) {
  if (typeof value !== 'number') return undefined;
  const rounded = Math.round(value);
  return Math.max(0, Math.min(5, rounded));
}

function mapGoogleReview(
  review: Review,
  index: number,
  linkHref?: string
): TestimonialCard | null {
  const rating = normalizeRating(review.rating);
  const quote =
    review.content?.trim() || (rating ? `Rated ${rating} out of 5 on Google.` : '');
  if (!quote) return null;
  return {
    image: review.avatar,
    name: review.author || 'Google reviewer',
    username: rating ? `${rating}-star Google review` : 'Google review',
    quote,
    date: review.dateLabel,
    verified: 'true',
    linkHref
  };
}

export function TestimonialsCards01({
  eyebrow = 'Testimonials',
  heading = 'Think about us',
  description =
    "That's the main thing people are controlled by! Thoughts - their perception of themselves!",
  linkLabel = 'See on',
  source = 'manual',
  reviewsLimit = DEFAULT_REVIEWS_LIMIT,
  googleReviewsUrl,
  testimonials = DEFAULT_TESTIMONIALS
}: TestimonialsCards01Props) {
  const [googleItems, setGoogleItems] = useState<TestimonialCard[]>([]);
  const resolvedReviewsLimit = Math.max(1, Math.min(reviewsLimit || DEFAULT_REVIEWS_LIMIT, 12));
  const resolvedGoogleReviewsUrl =
    googleReviewsUrl || process.env.NEXT_PUBLIC_GOOGLE_REVIEWS_URL;
  const showGoogle = source === 'google' || source === 'all';

  useEffect(() => {
    if (!showGoogle) {
      setGoogleItems([]);
      return;
    }

    let active = true;
    const controller = new AbortController();

    const load = async () => {
      try {
        const res = await fetch('/api/content/reviews?source=google', {
          cache: 'no-store',
          signal: controller.signal
        });
        if (!res.ok) return;
        const data = (await res.json()) as { reviews?: Review[] };
        const items = (data.reviews || [])
          .map((review, index) => mapGoogleReview(review, index, resolvedGoogleReviewsUrl))
          .filter(Boolean) as TestimonialCard[];
        if (active) {
          setGoogleItems(items.slice(0, resolvedReviewsLimit));
        }
      } catch {
        if (active) {
          setGoogleItems([]);
        }
      }
    };

    void load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [resolvedGoogleReviewsUrl, resolvedReviewsLimit, showGoogle]);

  const items = useMemo(() => {
    if (source === 'google') return googleItems;
    if (source === 'all') return [...testimonials, ...googleItems];
    return testimonials;
  }, [googleItems, source, testimonials]);

  if (!items.length) return null;

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="mb-16">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {eyebrow}
          </p>
          <h2 className="mb-4 text-3xl font-bold text-foreground">{heading}</h2>
          <p className="max-w-lg text-lg text-muted-foreground">{description}</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((testimonial, index) => {
            const isVerified =
              testimonial.verified === true || testimonial.verified === 'true';
            return (
              <Card key={`${testimonial.name}-${index}`}>
                <CardHeader className="flex flex-row items-center gap-4 px-6">
                  <Avatar>
                    <AvatarImage alt={`${testimonial.name} image`} src={testimonial.image} />
                    <AvatarFallback>{getInitials(testimonial.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      {isVerified ? (
                        <BadgeCheck className="h-4 w-4 text-primary" />
                      ) : null}
                    </div>
                    {testimonial.username ? (
                      <p className="text-sm text-muted-foreground">{testimonial.username}</p>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="px-6">
                  <blockquote className="text-muted-foreground">{testimonial.quote}</blockquote>
                </CardContent>
                <CardFooter className="flex items-center justify-between gap-4 px-6">
                  {testimonial.linkHref ? (
                    <a
                      className="flex items-center gap-1.5 text-sm font-semibold text-foreground hover:underline"
                      href={testimonial.linkHref}
                    >
                      {linkLabel} <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                  {testimonial.date ? (
                    <p className="text-sm text-muted-foreground">{testimonial.date}</p>
                  ) : null}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export const testimonialsCards01Config: ComponentConfig<TestimonialsCards01Props> = {
  fields: {
    eyebrow: { type: 'text' },
    heading: { type: 'text' },
    description: { type: 'textarea' },
    linkLabel: { type: 'text' },
    source: {
      type: 'select',
      options: [
        { label: 'Manual', value: 'manual' },
        { label: 'Google', value: 'google' },
        { label: 'All', value: 'all' }
      ]
    },
    reviewsLimit: { type: 'number' },
    googleReviewsUrl: { type: 'text' },
    testimonials: {
      type: 'array',
      arrayFields: {
        image: { type: 'text' },
        name: { type: 'text' },
        username: { type: 'text' },
        quote: { type: 'textarea' },
        date: { type: 'text' },
        verified: {
          type: 'select',
          options: [
            { label: 'Yes', value: 'true' },
            { label: 'No', value: 'false' }
          ]
        },
        linkHref: { type: 'text' }
      }
    }
  },
  defaultProps: {
    eyebrow: 'Testimonials',
    heading: 'Think about us',
    description:
      "That's the main thing people are controlled by! Thoughts - their perception of themselves!",
    linkLabel: 'See on',
    source: 'manual',
    reviewsLimit: DEFAULT_REVIEWS_LIMIT,
    testimonials: DEFAULT_TESTIMONIALS
  },
  render: ({ puck, ...props }) => {
    void puck
    return <TestimonialsCards01 {...props} />
  }
};
