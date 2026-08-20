'use client';

import { useState } from 'react';
import { Braces } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type EventRegistrationTokenPickerProps = {
  disabled?: boolean;
  tokens: readonly string[];
  onSelectToken: (token: string) => void;
};

export function EventRegistrationTokenPicker({
  disabled = false,
  tokens,
  onSelectToken
}: EventRegistrationTokenPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={disabled}>
          <Braces className="h-4 w-4" />
          Insert token
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[320px] p-0">
        <Command>
          <CommandInput placeholder="Search tokens" />
          <CommandList>
            <CommandEmpty>No matching tokens.</CommandEmpty>
            <CommandGroup heading="Available tokens">
              {tokens.map((token) => (
                <CommandItem
                  key={token}
                  value={token}
                  onSelect={() => {
                    onSelectToken(token);
                    setOpen(false);
                  }}
                >
                  <span className="font-mono text-xs">{token}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
