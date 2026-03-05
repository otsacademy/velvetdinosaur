import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Layers, ShieldCheck } from 'lucide-react';

const icons = {
  sparkles: Sparkles,
  layers: Layers,
  shield: ShieldCheck
};

export type FeatureGridItem = { title: string; description: string; icon: keyof typeof icons };

export type FeatureGridBlockProps = {
  heading?: string;
  items?: FeatureGridItem[];
};

export function FeatureGridBlock({
  heading = 'Everything you need to ship fast',
  items = [
    {
      title: 'Puck-ready blocks',
      description: 'All blocks are shadcn-based and editor-safe.',
      icon: 'sparkles'
    },
    {
      title: 'Design tokens',
      description: 'OKLCH tokens editable from the admin panel.',
      icon: 'layers'
    },
    {
      title: 'Secure by default',
      description: 'BetterAuth + per-site Mongo users + R2 uploads.',
      icon: 'shield'
    }
  ]
}: FeatureGridBlockProps) {
  return (
    <section className="space-y-8">
      <h2 className="text-2xl font-semibold">{heading}</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {items.map((item, index) => {
          const Icon = icons[item.icon] || Sparkles;
          return (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-[var(--vd-muted)] p-2 text-[var(--vd-fg)]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <CardTitle>{item.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{item.description}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
