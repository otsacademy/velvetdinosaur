import { type Dispatch, type SetStateAction } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { type NewsletterAdminSettings } from '@/components/edit/newsletter/newsletter-workspace.shared';

type NewsletterSettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: NewsletterAdminSettings;
  onChange: Dispatch<SetStateAction<NewsletterAdminSettings>>;
  onSave: () => void;
  isSaving: boolean;
  suppressedCount: number;
};

function NumberInput({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  hint
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
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
        step={step}
        value={String(value)}
        onChange={(event) => onChange(Number(event.target.value || 0))}
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function NewsletterSettingsDialog({
  open,
  onOpenChange,
  value,
  onChange,
  onSave,
  isSaving,
  suppressedCount
}: NewsletterSettingsDialogProps) {
  const setValue = <K extends keyof NewsletterAdminSettings>(key: K, next: NewsletterAdminSettings[K]) => {
    onChange((current) => ({ ...current, [key]: next }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Newsletter Deliverability Settings</DialogTitle>
          <DialogDescription>
            Control anti-spam checks and confirmation flow. Active suppression entries: {suppressedCount}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          <section className="grid gap-3 rounded-lg border p-4">
            <h3 className="text-sm font-semibold">Subscription Flow</h3>
            <label className="flex items-center justify-between gap-4 rounded-md border p-3">
              <span className="text-sm">Require double opt-in confirmation</span>
              <Switch
                checked={value.requireDoubleOptIn}
                onCheckedChange={(checked) => setValue('requireDoubleOptIn', checked === true)}
              />
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

          <section className="grid gap-3 rounded-lg border p-4">
            <h3 className="text-sm font-semibold">Rate Limits</h3>
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

          <section className="grid gap-3 rounded-lg border p-4">
            <h3 className="text-sm font-semibold">Bot Defenses</h3>
            <label className="flex items-center justify-between gap-4 rounded-md border p-3">
              <span className="text-sm">Enable honeypot field</span>
              <Switch
                checked={value.enableHoneypot}
                onCheckedChange={(checked) => setValue('enableHoneypot', checked === true)}
              />
            </label>
            <NumberInput
              id="newsletter-min-seconds"
              label="Minimum form fill time (seconds)"
              value={value.minSecondsToSubmit}
              onChange={(next) => setValue('minSecondsToSubmit', next)}
              min={0}
              max={30}
              hint="Submissions faster than this are rejected."
            />
            <label className="flex items-center justify-between gap-4 rounded-md border p-3">
              <span className="text-sm">Require CAPTCHA</span>
              <Switch
                checked={value.requireCaptcha}
                onCheckedChange={(checked) => setValue('requireCaptcha', checked === true)}
              />
            </label>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="grid gap-1.5">
                <Label>CAPTCHA provider</Label>
                <Select
                  value={value.captchaProvider}
                  onValueChange={(next) => setValue('captchaProvider', next as NewsletterAdminSettings['captchaProvider'])}
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
                placeholder="Stored in DB; leave unchanged to keep current value"
              />
            </div>
          </section>

          <section className="grid gap-3 rounded-lg border p-4">
            <h3 className="text-sm font-semibold">Suppression Handling</h3>
            <label className="flex items-center justify-between gap-4 rounded-md border p-3">
              <span className="text-sm">Block suppressed addresses at subscribe time</span>
              <Switch
                checked={value.blockSuppressedAddresses}
                onCheckedChange={(checked) => setValue('blockSuppressedAddresses', checked === true)}
              />
            </label>
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save settings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
