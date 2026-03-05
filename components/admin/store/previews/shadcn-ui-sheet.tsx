"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/registry/new-york-v4/ui/sheet";
import { Button } from "@/registry/new-york-v4/ui/button";

type Props = { triggerLabel?: string; title?: string; description?: string; body?: string; defaultOpen?: 'true' | 'false'; className?: string };

export default function ShadcnSheet({ triggerLabel = "Sheet", title = "Sheet title", description = '', body = '', defaultOpen = 'false', className = '' }: Props) {
  return (
    <div className={className}>
      <Sheet defaultOpen={defaultOpen === 'true'}>
        <SheetTrigger asChild>
          <Button variant="outline">{triggerLabel}</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            {description ? <SheetDescription>{description}</SheetDescription> : null}
          </SheetHeader>
          {body ? <div className="mt-4 whitespace-pre-wrap text-sm">{body}</div> : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
