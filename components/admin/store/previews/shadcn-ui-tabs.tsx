"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/new-york-v4/ui/tabs";

type TabType = { label: string; content: string };
type Props = { defaultTab?: number; tabs?: TabType[]; className?: string };

export default function ShadcnTabs({ defaultTab = 0, tabs = [], className = '' }: Props) {
  const values = tabs.map((_, idx) => `tab-${idx}`);
  const safeIndex = Math.min(Math.max(defaultTab || 0, 0), Math.max(values.length - 1, 0));
  const value = values[safeIndex] || values[0] || 'tab-0';
  return (
    <div className={className}>
      <Tabs defaultValue={value} className="w-full">
        <TabsList className="w-full justify-start">
          {tabs.map((tab, idx) => (
            <TabsTrigger key={values[idx]} value={values[idx]}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab, idx) => (
          <TabsContent key={values[idx]} value={values[idx]}>
            <div className="whitespace-pre-wrap text-sm">{tab.content}</div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
