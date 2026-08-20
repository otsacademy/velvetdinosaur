import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/support/search.ts');

import { supportModuleLabel } from '@/lib/support/constants';
import { listSupportArticles, listSupportDocs, type SupportArticleSummary, type SupportDocSummary } from '@/lib/support/content';
import { listSupportTickets, type SupportTicketSummary } from '@/lib/support/tickets';

export type SupportSearchResult = {
  kind: 'ticket' | 'doc' | 'article';
  id: string;
  title: string;
  subtitle: string;
  link: string;
  updatedAt: string | null;
  status: string;
};

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function rankText(text: string, q: string) {
  if (!q) return 0;
  const lower = text.toLowerCase();
  const qLower = q.toLowerCase();
  if (!lower.includes(qLower)) return 0;
  if (lower.startsWith(qLower)) return 4;
  if (lower.includes(` ${qLower}`)) return 3;
  return 2;
}

function rankTicket(ticket: SupportTicketSummary, q: string) {
  const moduleLabel = supportModuleLabel(ticket.module);
  return (
    rankText(ticket.ticketRef, q) * 3 +
    rankText(ticket.subject, q) * 4 +
    rankText(moduleLabel, q) * 2 +
    rankText(ticket.module.replaceAll('_', ' '), q)
  );
}

function rankDoc(doc: SupportDocSummary, q: string) {
  return rankText(doc.title, q) * 4 + rankText(doc.description, q) * 2 + rankText(doc.module, q) + rankText(doc.category, q);
}

function rankArticle(article: SupportArticleSummary, q: string) {
  return (
    rankText(article.title, q) * 4 +
    rankText(article.summary, q) * 2 +
    rankText(article.bodyText, q) +
    rankText(article.category, q)
  );
}

export async function searchSupportPortal(q: string, limit = 30) {
  const query = clean(q);
  if (!query) {
    return {
      query,
      results: [] as SupportSearchResult[]
    };
  }

  const hardLimit = Math.max(1, Math.min(200, Math.round(limit)));
  const perSourceLimit = Math.max(8, Math.min(120, hardLimit * 2));

  const [tickets, docs, articles] = await Promise.all([
    listSupportTickets({ statusGroup: 'all', q: query, limit: perSourceLimit }),
    listSupportDocs({ q: query, limit: perSourceLimit }),
    listSupportArticles({ type: 'all', q: query, limit: perSourceLimit })
  ]);

  const scored = [
    ...tickets
      .map((ticket) => ({
        score: rankTicket(ticket, query),
        updatedAt: ticket.lastActivityAt,
        item: {
          kind: 'ticket' as const,
          id: ticket.id,
          title: `${ticket.ticketRef} · ${ticket.subject}`,
          subtitle: [ticket.categoryLabel, supportModuleLabel(ticket.module), ticket.statusLabel]
            .filter(Boolean)
            .join(' · '),
          link: `/account/support?ticketId=${encodeURIComponent(ticket.id)}`,
          updatedAt: ticket.lastActivityAt,
          status: ticket.status
        }
      }))
      .filter((entry) => entry.score > 0),
    ...docs
      .map((doc) => ({
        score: rankDoc(doc, query),
        updatedAt: doc.updatedAt || doc.publishedAt,
        item: {
          kind: 'doc' as const,
          id: doc.id,
          title: doc.title,
          subtitle: [doc.category, doc.module].filter(Boolean).join(' · ') || 'Support document',
          link: doc.url,
          updatedAt: doc.updatedAt || doc.publishedAt,
          status: doc.linkType
        }
      }))
      .filter((entry) => entry.score > 0),
    ...articles
      .map((article) => ({
        score: rankArticle(article, query),
        updatedAt: article.updatedAt || article.publishedAt,
        item: {
          kind: 'article' as const,
          id: article.id,
          title: article.title,
          subtitle: [article.type, article.category || article.module].filter(Boolean).join(' · '),
          link: `/account/support?article=${encodeURIComponent(article.slug)}`,
          updatedAt: article.updatedAt || article.publishedAt,
          status: article.type
        }
      }))
      .filter((entry) => entry.score > 0)
  ];

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return bTime - aTime;
  });

  return {
    query,
    results: scored.slice(0, hardLimit).map((entry) => entry.item)
  };
}
