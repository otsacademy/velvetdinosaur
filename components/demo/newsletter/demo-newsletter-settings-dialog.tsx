import { type Dispatch, type SetStateAction } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { DemoNewsletterSettings } from '@/lib/demo-newsletter-seed';

type DemoNewsletterSettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: DemoNewsletterSettings;
  onChange: Dispatch<SetStateAction<DemoNewsletterSettings>>;
  onSave: () => void;
};

function NumberInput({
  id,
  label,
  value,
  onChange,
  min,
  max,
  hint
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  hint?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        value={String(value)}
        onChange={(event) => onChange(Number(event.target.value || 0))}
      />
      {hint ? <p className="text-xs text-[var(--vd-muted-fg)]">{hint}</p> : null}
    </div>
  );
}

export function DemoNewsletterSettingsDialog({
  open,
  onOpenChange,
  value,
  onChange,
  onSave
}: DemoNewsletterSettingsDialogProps) {
  const setValue = <K extends keyof DemoNewsletterSettings>(key: K, next: DemoNewsletterSettings[K]) => {
    onChange((current) => ({ ...current, [key]: next }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Newsletter deliverability settings</DialogTitle>
          <DialogDescription>
            Show the anti-spam controls and confirmation flow without connecting to a real mail provider.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          <section className="grid gap-3 rounded-lg border border-[var(--vd-border)] p-4">
            <h3 className="text-sm font-semibold">Subscription flow</h3>
            <label className="flex items-center justify-between gap-4 rounded-md border border-[var(--vd-border)] p-3">
              <span className="text-sm">Require double opt-in confirmation</span>
              <Switch checked={value.requireDoubleOptIn} onCheckedChange={(checked) => setValue('requireDoubleOptIn', checked === true)} />
            </label>
            <NumberInput
              id="newsletter-pending-token-ttl"
              label="Confirmation token TTL (minutes)"
              value={value.pendingTokenTtlMinutes}
              onChange={(next) => setValue('pendingTokenTtlMinutes', next)}
              min={10}
              max={60 * 24 * 14}
            />
            <NumberInput
              id="newsletter-confirm-resend-cooldown"
              label="Confirmation resend cooldown (minutes)"
              value={value.resendConfirmationCooldownMinutes}
              onChange={(next) => setValue('resendConfirmationCooldownMinutes', next)}
              min={1}
              max={1440}
            />
          </section>

          <section className="grid gap-3 rounded-lg border border-[var(--vd-border)] p-4">
            <h3 className="text-sm font-semibold">Rate limits</h3>
            <div className="grid gap-3 md:grid-cols-3">
              <NumberInput
                id="newsletter-ip-minute"
                label="Per IP per minute"
                value={value.rateLimitPerIpPerMinute}
                onChange={(next) => setValue('rateLimitPerIpPerMinute', next)}
                min={1}
                max={300}
              />
              <NumberInput
                id="newsletter-ip-hour"
                label="Per IP per hour"
                value={value.rateLimitPerIpPerHour}
                onChange={(next) => setValue('rateLimitPerIpPerHour', next)}
                min={10}
                max={5000}
              />
              <NumberInput
                id="newsletter-email-day"
                label="Per email per day"
                value={value.rateLimitPerEmailPerDay}
                onChange={(next) => setValue('rateLimitPerEmailPerDay', next)}
                min={1}
                max={200}
              />
            </div>
          </section>

          <section className="grid gap-3 rounded-lg border border-[var(--vd-border)] p-4">
            <h3 className="text-sm font-semibold">Bot defences</h3>
            <label className="flex items-center justify-between gap-4 rounded-md border border-[var(--vd-border)] p-3">
              <span className="text-sm">Enable honeypot field</span>
              <Switch checked={value.enableHoneypot} onCheckedChange={(checked) => setValue('enableHoneypot', checked === true)} />
            </label>
            <NumberInput
              id="newsletter-min-seconds"
              label="Minimum form fill time (seconds)"
              value={value.minSecondsToSubmit}
              onChange={(next) => setValue('minSecondsToSubmit', next)}
              min={0}
              max={30}
              hint="Faster submissions are treated as suspicious in this demo."
            />
            <label className="flex items-center justify-between gap-4 rounded-md border border-[var(--vd-border)] p-3">
              <span className="text-sm">Require CAPTCHA</span>
              <Switch checked={value.requireCaptcha} onCheckedChange={(checked) => setValue('requireCaptcha', checked === true)} />
            </label>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="grid gap-1.5">
                <Label>CAPTCHA provider</Label>
                <Select
                  value={value.captchaProvider}
                  onValueChange={(next) => setValue('captchaProvider', next as DemoNewsletterSettings['captchaProvider'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="turnstile">Cloudflare Turnstile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5 md:col-span-2">
                <Label htmlFor="newsletter-turnstile-site">Turnstile site key</Label>
                <Input
                  id="newsletter-turnstile-site"
                  value={value.turnstileSiteKey}
                  onChange={(event) => setValue('turnstileSiteKey', event.target.value)}
                  placeholder="0x4AAAA..."
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="newsletter-turnstile-secret">Turnstile secret key</Label>
              <Input
                id="newsletter-turnstile-secret"
                type="password"
                value={value.turnstileSecretKey}
                onChange={(event) => setValue('turnstileSecretKey', event.target.value)}
                placeholder="Stored only in this demonstration tab"
              />
            </div>
          </section>

          <section className="grid gap-3 rounded-lg border border-[var(--vd-border)] p-4">
            <h3 className="text-sm font-semibold">Suppression handling</h3>
            <label className="flex items-center justify-between gap-4 rounded-md border border-[var(--vd-border)] p-3">
              <span className="text-sm">Block suppressed addresses at subscribe time</span>
              <Switch checked={value.blockSuppressedAddresses} onCheckedChange={(checked) => setValue('blockSuppressedAddresses', checked === true)} />
            </label>
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={onSave}>Save settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
