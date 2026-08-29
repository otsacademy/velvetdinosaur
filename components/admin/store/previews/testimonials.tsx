import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';

const items = [
  {
    quote: 'We launched in days and our team can update everything without engineering tickets.',
    name: 'Sam Li',
    role: 'Product Lead'
  },
  {
    quote: 'The shadcn blocks feel premium, and the theme editor keeps everything consistent.',
    name: 'Ava Perez',
    role: 'Creative Director'
  },
  {
    quote: 'Sauro CMS gives us full control while still keeping guardrails for the brand team.',
    name: 'Noah Reed',
    role: 'Marketing'
  }
];

export default function TestimonialsPreview() {
  return (
    <section className="space-y-8">
      <div>
        <Badge className="mb-3 inline-flex">Testimonials</Badge>
        <h2 className="text-2xl font-semibold">Loved by fast-moving teams</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {items.map((item) => (
          <Card key={item.name}>
            <CardHeader className="space-y-2">
              <div className="flex gap-1 text-[var(--vd-primary)]">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="h-4 w-4" />
                ))}
              </div>
              <CardTitle className="text-base">{item.name}</CardTitle>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--vd-muted-fg)]">{item.role}</p>
            </CardHeader>
            <CardContent className="text-sm text-[var(--vd-muted-fg)]">“{item.quote}”</CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
