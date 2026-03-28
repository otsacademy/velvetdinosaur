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
  heading = 'Three clear selling points',
  items = [
    {
      title: 'Clear offer',
      description: 'Explain the core service in a way a new visitor can understand in seconds.',
      icon: 'sparkles'
    },
    {
      title: 'Distinct point of view',
      description: 'Use this block to show what makes the business feel considered rather than interchangeable.',
      icon: 'layers'
    },
    {
      title: 'Trust and clarity',
      description: 'Turn vague promises into practical reasons someone would enquire.',
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
