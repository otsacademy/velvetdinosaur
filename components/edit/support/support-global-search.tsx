'use client';

import { useEffect, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import {
  formatDateTime,
  readJson,
  type SupportGlobalSearchResult,
  type SupportTicketStatus
} from '@/components/edit/support/support-workspace.shared';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type SupportGlobalSearchProps = {
  onSelectTicket: (ticketId: string, status?: SupportTicketStatus) => void;
};

export function SupportGlobalSearch({ onSelectTicket }: SupportGlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SupportGlobalSearchResult[]>([]);

  useEffect(() => {
    const next = query.trim();
    if (!next) {
      setResults([]);
      return;
    }

    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('q', next);
        params.set('limit', '24');
        const response = await fetch(`/api/admin/support/search?${params.toString()}`, {
          cache: 'no-store',
          credentials: 'include'
        });
        const payload = (await readJson(response)) as { results?: SupportGlobalSearchResult[] };
        setResults(Array.isArray(payload.results) ? payload.results : []);
      } finally {
        setIsLoading(false);
      }
    }, 240);

    return () => window.clearTimeout(timeout);
  }, [query]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Global Portal Search</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tickets, docs, and articles" className="pl-8" />
        </div>

        {!query.trim() ? (
          <p className="text-sm text-muted-foreground">Type to search across tickets, documents, and support articles.</p>
        ) : isLoading ? (
          <div className="rounded-md border p-4 text-center text-muted-foreground">
            <Loader2 className="mx-auto mb-2 h-4 w-4 animate-spin" />
            Searching...
          </div>
        ) : results.length === 0 ? (
          <p className="text-sm text-muted-foreground">No matching records found.</p>
        ) : (
          <div className="space-y-2">
            {results.map((result) => (
              <button
                key={`${result.kind}-${result.id}`}
                type="button"
                className="w-full rounded-md border p-3 text-left hover:bg-muted/40"
                onClick={() => {
                  if (result.kind === 'ticket') {
                    onSelectTicket(result.id, result.status as SupportTicketStatus);
                    return;
                  }
                  window.open(result.link, '_blank', 'noopener,noreferrer');
                }}
              >
                <p className="text-xs uppercase text-muted-foreground">{result.kind}</p>
                <p className="font-medium">{result.title}</p>
                <p className="line-clamp-1 text-sm text-muted-foreground">{result.subtitle}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(result.updatedAt)}</p>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
