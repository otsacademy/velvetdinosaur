export type DemoReviewCommentStatus = 'open' | 'resolved';

export type DemoReviewComment = {
  id: string;
  slug: string;
  pathname: string;
  reviewTokenId: string;
  annotationId: string;
  authorName: string;
  reviewerEmail: string;
  body: string;
  status: DemoReviewCommentStatus;
  createdAt: string;
};

export type DemoReviewLinkStatus = 'active' | 'expired' | 'revoked';

export type DemoReviewLink = {
  id: string;
  token: string;
  label: string;
  pathname: string;
  reviewerName: string;
  reviewerEmail: string;
  expiresAt: string;
  status: DemoReviewLinkStatus;
  createdAt: string;
};

export function createDemoReviewSeed(): {
  links: DemoReviewLink[];
  comments: DemoReviewComment[];
} {
  return {
    links: [
      {
        id: 'link-home-01',
        token: 'rvw_home_01',
        label: 'Homepage refresh review',
        pathname: '/',
        reviewerName: 'Amelia Hart',
        reviewerEmail: 'amelia@harbourandpine.example',
        expiresAt: '2026-03-29T16:00:00.000Z',
        status: 'active',
        createdAt: '2026-03-21T09:00:00.000Z'
      },
      {
        id: 'link-about-01',
        token: 'rvw_about_01',
        label: 'About page review',
        pathname: '/about',
        reviewerName: 'Leo Morrow',
        reviewerEmail: 'leo@shorelinepartner.example',
        expiresAt: '2026-03-24T12:00:00.000Z',
        status: 'expired',
        createdAt: '2026-03-17T12:00:00.000Z'
      },
      {
        id: 'link-services-01',
        token: 'rvw_services_01',
        label: 'Services page review',
        pathname: '/services',
        reviewerName: 'Nina Solis',
        reviewerEmail: 'nina@quiettype.example',
        expiresAt: '2026-03-27T10:30:00.000Z',
        status: 'active',
        createdAt: '2026-03-22T10:00:00.000Z'
      }
    ],
    comments: [
      {
        id: 'comment-1',
        slug: 'home',
        pathname: '/',
        reviewTokenId: 'rvw_home_01',
        annotationId: 'anno_001',
        authorName: 'Amelia Hart',
        reviewerEmail: 'amelia@harbourandpine.example',
        body: 'The first headline feels right. I would tighten the supporting sentence so the opening lands faster.',
        status: 'open',
        createdAt: '2026-03-21T09:45:00.000Z'
      },
      {
        id: 'comment-2',
        slug: 'home',
        pathname: '/',
        reviewTokenId: 'rvw_home_01',
        annotationId: 'anno_002',
        authorName: 'Amelia Hart',
        reviewerEmail: 'amelia@harbourandpine.example',
        body: 'Could the primary button label be a bit more direct here?',
        status: 'resolved',
        createdAt: '2026-03-21T10:15:00.000Z'
      },
      {
        id: 'comment-3',
        slug: 'about',
        pathname: '/about',
        reviewTokenId: 'rvw_about_01',
        annotationId: 'anno_003',
        authorName: 'Leo Morrow',
        reviewerEmail: 'leo@shorelinepartner.example',
        body: 'The founder portrait works, but the paragraph below could use one less sentence.',
        status: 'resolved',
        createdAt: '2026-03-18T14:20:00.000Z'
      },
      {
        id: 'comment-4',
        slug: 'services',
        pathname: '/services',
        reviewTokenId: 'rvw_services_01',
        annotationId: 'anno_004',
        authorName: 'Nina Solis',
        reviewerEmail: 'nina@quiettype.example',
        body: 'The process section is strong. I would add one proof point after step two.',
        status: 'open',
        createdAt: '2026-03-22T11:05:00.000Z'
      },
      {
        id: 'comment-5',
        slug: 'services',
        pathname: '/services',
        reviewTokenId: 'rvw_services_01',
        annotationId: 'anno_005',
        authorName: 'Nina Solis',
        reviewerEmail: 'nina@quiettype.example',
        body: 'Footer CTA copy is good now. No further changes needed there.',
        status: 'resolved',
        createdAt: '2026-03-22T11:40:00.000Z'
      },
      {
        id: 'comment-6',
        slug: 'home',
        pathname: '/',
        reviewTokenId: 'rvw_home_01',
        annotationId: 'anno_006',
        authorName: 'Amelia Hart',
        reviewerEmail: 'amelia@harbourandpine.example',
        body: 'The testimonial block feels credible. I would keep this exactly as it is.',
        status: 'resolved',
        createdAt: '2026-03-23T08:15:00.000Z'
      }
    ]
  };
}
