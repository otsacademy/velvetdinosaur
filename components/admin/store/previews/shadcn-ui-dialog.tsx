"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/registry/new-york-v4/ui/dialog";
import { Button } from "@/registry/new-york-v4/ui/button";

type Props = { triggerLabel?: string; title?: string; description?: string; body?: string; defaultOpen?: 'true' | 'false'; className?: string };

export default function ShadcnDialog({ triggerLabel = "Dialog", title = "Dialog title", description = '', body = '', defaultOpen = 'false', className = '' }: Props) {
  return (
    <div className={className}>
      <Dialog defaultOpen={defaultOpen === 'true'}>
        <DialogTrigger asChild>
          <Button variant="outline">{triggerLabel}</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
          {body ? <div className="whitespace-pre-wrap text-sm">{body}</div> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
