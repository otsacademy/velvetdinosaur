"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/registry/new-york-v4/ui/accordion";

type AccordionItemType = { title: string; content: string };
type Props = { type?: 'single' | 'multiple'; collapsible?: 'true' | 'false'; defaultOpen?: number; items?: AccordionItemType[]; className?: string };

export default function ShadcnAccordion({ type = 'single', collapsible = 'true', defaultOpen = 0, items = [], className = '' }: Props) {
  const values = items.map((_, idx) => `item-${idx}`);
  const safeIndex = Math.min(Math.max(defaultOpen || 0, 0), Math.max(values.length - 1, 0));
  if (type === 'multiple') {
    const defaultValue = values.slice(0, safeIndex + 1);
    return (
      <div className={className}>
        <Accordion type="multiple" defaultValue={defaultValue} className="w-full">
          {items.map((item, idx) => (
            <AccordionItem key={values[idx]} value={values[idx]}>
              <AccordionTrigger>{item.title}</AccordionTrigger>
              <AccordionContent>
                <div className="whitespace-pre-wrap text-sm">{item.content}</div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    );
  }

  const defaultValue = values[safeIndex] || undefined;
  return (
    <div className={className}>
      <Accordion
        type="single"
        collapsible={collapsible === 'true'}
        defaultValue={defaultValue}
        className="w-full"
      >
        {items.map((item, idx) => (
          <AccordionItem key={values[idx]} value={values[idx]}>
            <AccordionTrigger>{item.title}</AccordionTrigger>
            <AccordionContent>
              <div className="whitespace-pre-wrap text-sm">{item.content}</div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
