"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

type WizardState = {
  site: {
    domain: string;
    slug: string;
    adminEmail: string;
  };
  r2: {
    jurisdiction: string;
    credentialMode: 'mint' | 'explicit' | 'existing';
    rotateToken: boolean;
    useExistingCreds: boolean;
    cloudflareMode: 'default' | 'custom';
    cloudflareAccountId: string;
    cloudflareApiToken: string;
    cloudflareTokenMinter: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  domainService: {
    enabled: boolean;
    url: string;
    apiKey: string;
    root: string;
    serverIp: string;
    parentZone: string;
    actions: {
      createZone: boolean;
      webPreset: boolean;
      postmark: boolean;
      register: boolean;
      import: boolean;
      migrate: boolean;
    };
  };
  app: {
    repoUrl: string;
    templatePath: string;
    skipApp: boolean;
    repair: boolean;
  };
  infra: {
    port: string;
    skipCertbot: boolean;
    force: boolean;
  };
  googleFontsApiKey: string;
};

const steps = ['Basics', 'DNS + Domain service', 'R2 + Cloudflare', 'App + Infra', 'Review'];
const DRAFT_KEY = 'vd-installer-draft';

const EMPTY_FORM: WizardState = {
  site: { domain: '', slug: '', adminEmail: '' },
  r2: {
    jurisdiction: 'default',
    credentialMode: 'mint',
    rotateToken: false,
    useExistingCreds: false,
    cloudflareMode: 'default',
    cloudflareAccountId: '',
    cloudflareApiToken: '',
    cloudflareTokenMinter: '',
    accessKeyId: '',
    secretAccessKey: ''
  },
  domainService: {
    enabled: true,
    url: '',
    apiKey: '',
    root: '',
    serverIp: '',
    parentZone: '',
    actions: {
      createZone: true,
      webPreset: true,
      postmark: false,
      register: false,
      import: false,
      migrate: false
    }
  },
  app: {
    repoUrl: '',
    templatePath: '',
    skipApp: false,
    repair: false
  },
  infra: {
    port: '',
    skipCertbot: false,
    force: false
  },
  googleFontsApiKey: ''
};

function sanitizeDraft(raw: WizardState): WizardState {
  return {
    ...raw,
    r2: {
      ...raw.r2,
      cloudflareApiToken: '',
      cloudflareTokenMinter: '',
      accessKeyId: '',
      secretAccessKey: ''
    },
    domainService: {
      ...raw.domainService,
      apiKey: ''
    }
  };
}

function loadDraftFromStorage() {
  const fallback = { form: EMPTY_FORM, step: 0 };
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(DRAFT_KEY);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as { form?: WizardState; step?: number } | null;
    const form = parsed?.form ? sanitizeDraft(parsed.form) : EMPTY_FORM;
    const step = typeof parsed?.step === 'number' ? parsed.step : 0;
    return { form, step };
  } catch {
    window.localStorage.removeItem(DRAFT_KEY);
    return fallback;
  }
}

export function SiteWizard() {
  const [initialDraft] = useState(loadDraftFromStorage);
  const [step, setStep] = useState(initialDraft.step);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [jobId, setJobId] = useState('');
  const [dnsBusy, setDnsBusy] = useState(false);
  const [dnsResult, setDnsResult] = useState<{
    ok: boolean;
    records?: { a: string[]; aaaa: string[]; cname: string[] };
    error?: string;
    expectedIp?: string;
  } | null>(null);
  const [domainServiceTouched, setDomainServiceTouched] = useState(false);
  const [showAdvancedDomainService, setShowAdvancedDomainService] = useState(false);

  const [form, setForm] = useState<WizardState>(initialDraft.form);

  const domainParts = useMemo(
    () => form.site.domain.trim().split('.').filter(Boolean),
    [form.site.domain]
  );
  const isSubdomain = domainParts.length > 2;
  const derivedParentZone = isSubdomain ? domainParts.slice(-2).join('.') : '';

  useEffect(() => {
    const sanitized = {
      ...form,
      r2: {
        ...form.r2,
        cloudflareApiToken: '',
        cloudflareTokenMinter: '',
        accessKeyId: '',
        secretAccessKey: ''
      },
      domainService: {
        ...form.domainService,
        apiKey: ''
      }
    };
    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ form: sanitized, step, savedAt: new Date().toISOString() })
    );
  }, [form, step]);

  useEffect(() => {
    if (domainServiceTouched) return;
    const nextParentZone = isSubdomain ? derivedParentZone : form.domainService.parentZone;
    if (form.domainService.enabled && nextParentZone === form.domainService.parentZone) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- keep domain service defaults in sync with domain entry
    setForm((prev) => ({
      ...prev,
      domainService: {
        ...prev.domainService,
        enabled: true,
        parentZone: nextParentZone
      }
    }));
  }, [domainServiceTouched, isSubdomain, derivedParentZone, form.domainService.enabled, form.domainService.parentZone]);

  const clearDraft = () => {
    window.localStorage.removeItem(DRAFT_KEY);
    setMessage('Draft cleared.');
  };

  const runDnsCheck = async () => {
    const domain = form.site.domain.trim();
    if (!domain) {
      return { ok: false, error: 'Enter a domain first.' };
    }
    const res = await fetch(`/api/installer/dns-check?domain=${encodeURIComponent(domain)}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return { ok: false, error: data?.error || 'DNS check failed.' };
    }
    return {
      ok: Boolean(data?.ok),
      records: data?.records || { a: [], aaaa: [], cname: [] },
      expectedIp: data?.expectedIp || undefined,
      error: data?.ok ? undefined : data?.error
    };
  };

  const checkDns = async () => {
    setDnsBusy(true);
    setDnsResult(null);
    const result = await runDnsCheck();
    setDnsResult(result);
    setDnsBusy(false);
  };

  const canContinue = useMemo(() => {
    if (step === 0) {
      return Boolean(
        form.site.domain.trim() &&
          form.site.slug.trim() &&
          form.site.adminEmail.trim()
      );
    }
    return true;
  }, [form, step]);

  const submit = async () => {
    setBusy(true);
    setMessage('');
    setJobId('');
    let dnsWarning = '';
    if (!form.infra.skipCertbot) {
      setDnsBusy(true);
      const result = dnsResult?.ok ? dnsResult : await runDnsCheck();
      setDnsResult(result);
      setDnsBusy(false);
      if (!result.ok && !form.domainService.enabled) {
        setMessage(result.error || 'DNS not propagated yet. Add records before installing.');
        setBusy(false);
        return;
      }
      if (!result.ok && form.domainService.enabled) {
        dnsWarning =
          result.error ||
          'DNS not propagated yet. Domain-service will create records, but certbot may still fail until propagation completes.';
      }
    }
    const derivedParentZone =
      isSubdomain && !form.domainService.parentZone
        ? domainParts.slice(-2).join('.')
        : form.domainService.parentZone;
    const normalizedDomainService = {
      ...form.domainService,
      parentZone: derivedParentZone,
      actions: isSubdomain
        ? {
            ...form.domainService.actions,
            createZone: false,
            postmark: false,
            register: false,
            import: false,
            migrate: false
          }
        : form.domainService.actions
    };
    const res = await fetch('/api/installer/jobs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        site: form.site,
        r2: form.r2,
        domainService: normalizedDomainService,
        app: form.app,
        infra: {
          port: form.infra.port,
          skipCertbot: form.infra.skipCertbot,
          force: form.infra.force
        },
        googleFontsApiKey: form.googleFontsApiKey
      })
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setMessage(data?.error || 'Installer request failed');
      setBusy(false);
      return;
    }
    setJobId(data?.job?.id || '');
    setMessage(dnsWarning ? `Install job queued. ${dnsWarning}` : 'Install job queued.');
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Add website</h1>
          <p className="text-sm text-[var(--vd-muted-fg)]">
            Step {step + 1} of {steps.length}: {steps[step]}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/sites">Back</Link>
          </Button>
          <Button variant="outline" onClick={clearDraft}>
            Clear draft
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{steps[step]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Domain</Label>
                <Input
                  placeholder="example.com"
                  value={form.site.domain}
                  onChange={(e) =>
                    setForm((prev) => {
                      const nextDomain = e.target.value;
                      return {
                        ...prev,
                        site: { ...prev.site, domain: nextDomain }
                      };
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Site slug</Label>
                <Input
                  placeholder="example"
                  value={form.site.slug}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      site: { ...prev.site, slug: e.target.value }
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Admin email</Label>
                <Input
                  placeholder="admin@example.com"
                  value={form.site.adminEmail}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      site: { ...prev.site, adminEmail: e.target.value }
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Google Fonts API key (optional)</Label>
                <Input
                  placeholder="AIza..."
                  value={form.googleFontsApiKey}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, googleFontsApiKey: e.target.value }))
                  }
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>R2 jurisdiction</Label>
                  <Select
                    value={form.r2.jurisdiction}
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        r2: { ...prev.r2, jurisdiction: value }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select jurisdiction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">default</SelectItem>
                      <SelectItem value="eu">eu</SelectItem>
                      <SelectItem value="fedramp">fedramp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Credential mode</Label>
                  <Select
                    value={form.r2.credentialMode}
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        r2: {
                          ...prev.r2,
                          credentialMode: value as WizardState['r2']['credentialMode']
                        }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mint">Mint via token</SelectItem>
                      <SelectItem value="explicit">Provide access keys</SelectItem>
                      <SelectItem value="existing">Reuse existing creds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={form.r2.rotateToken}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({
                        ...prev,
                        r2: { ...prev.r2, rotateToken: checked }
                      }))
                    }
                  />
                  Rotate R2 token
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={form.r2.useExistingCreds}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({
                        ...prev,
                        r2: { ...prev.r2, useExistingCreds: checked }
                      }))
                    }
                  />
                  Use existing creds
                </label>
              </div>

              <div className="space-y-2">
                <Label>Cloudflare account</Label>
                <Select
                  value={form.r2.cloudflareMode}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      r2: {
                        ...prev.r2,
                        cloudflareMode: value as WizardState['r2']['cloudflareMode']
                      }
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Use server default</SelectItem>
                    <SelectItem value="custom">Custom account</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.r2.cloudflareMode === 'custom' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Cloudflare account ID</Label>
                    <Input
                      value={form.r2.cloudflareAccountId}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          r2: { ...prev.r2, cloudflareAccountId: e.target.value }
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cloudflare API token</Label>
                    <Input
                      type="password"
                      value={form.r2.cloudflareApiToken}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          r2: { ...prev.r2, cloudflareApiToken: e.target.value }
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Token minting token (optional)</Label>
                    <Input
                      type="password"
                      value={form.r2.cloudflareTokenMinter}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          r2: { ...prev.r2, cloudflareTokenMinter: e.target.value }
                        }))
                      }
                    />
                  </div>
                </div>
              )}

              {form.r2.credentialMode === 'explicit' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>R2 access key ID</Label>
                    <Input
                      type="password"
                      value={form.r2.accessKeyId}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          r2: { ...prev.r2, accessKeyId: e.target.value }
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>R2 secret access key</Label>
                    <Input
                      type="password"
                      value={form.r2.secretAccessKey}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          r2: { ...prev.r2, secretAccessKey: e.target.value }
                        }))
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={form.domainService.enabled}
                  onCheckedChange={(checked) => {
                    setDomainServiceTouched(true);
                    setForm((prev) => ({
                      ...prev,
                      domainService: { ...prev.domainService, enabled: checked }
                    }));
                  }}
                />
                Automate DNS with domain-service
              </label>

              {form.domainService.enabled ? (
                <p className="text-xs text-[var(--vd-muted-fg)]">
                  The installer will create DNS records and wait for propagation before certbot.
                </p>
              ) : (
                <div className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-muted)] p-4 text-sm text-[var(--vd-muted-fg)]">
                  Manual DNS selected. Create the DNS records in the parent zone (e.g. an A record
                  for the subdomain pointing to the server IP).
                </div>
              )}

              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={form.domainService.actions.webPreset}
                  disabled={!form.domainService.enabled}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({
                      ...prev,
                      domainService: {
                        ...prev.domainService,
                        actions: { ...prev.domainService.actions, webPreset: checked }
                      }
                    }))
                  }
                />
                Create DNS records (A + www CNAME)
              </label>

              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={form.domainService.actions.postmark}
                  disabled={!form.domainService.enabled || isSubdomain}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({
                      ...prev,
                      domainService: {
                        ...prev.domainService,
                        actions: { ...prev.domainService.actions, postmark: checked }
                      }
                    }))
                  }
                />
                Email (Postmark)
              </label>
              {isSubdomain ? (
                <p className="text-xs text-[var(--vd-muted-fg)]">
                  Postmark setup is only supported for apex domains.
                </p>
              ) : null}

              <div className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-muted)] p-4 text-sm text-[var(--vd-muted-fg)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span>DNS propagation check</span>
                  <Button variant="outline" size="sm" onClick={() => void checkDns()} disabled={dnsBusy}>
                    {dnsBusy ? 'Checking...' : 'Check DNS'}
                  </Button>
                </div>
                {dnsResult ? (
                  <div className="mt-3 space-y-1 text-xs text-[var(--vd-muted-fg)]">
                    {dnsResult.expectedIp ? (
                      <div>Expected IP: {dnsResult.expectedIp}</div>
                    ) : null}
                    {dnsResult.records ? (
                      <>
                        <div>A: {dnsResult.records.a.length ? dnsResult.records.a.join(', ') : '—'}</div>
                        <div>
                          AAAA:{' '}
                          {dnsResult.records.aaaa.length ? dnsResult.records.aaaa.join(', ') : '—'}
                        </div>
                        <div>
                          CNAME:{' '}
                          {dnsResult.records.cname.length ? dnsResult.records.cname.join(', ') : '—'}
                        </div>
                      </>
                    ) : null}
                    {dnsResult.error ? <div className="text-red-600">{dnsResult.error}</div> : null}
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--vd-muted-fg)]">Advanced domain-service settings</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedDomainService((prev) => !prev)}
                >
                  {showAdvancedDomainService ? 'Hide' : 'Show'}
                </Button>
              </div>

              {form.domainService.enabled && showAdvancedDomainService && (
                <div className="space-y-4 rounded-[var(--vd-radius)] border border-[var(--vd-border)] p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Domain-service URL</Label>
                      <Input
                        value={form.domainService.url}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            domainService: { ...prev.domainService, url: e.target.value }
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Domain-service API key</Label>
                      <Input
                        type="password"
                        value={form.domainService.apiKey}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            domainService: { ...prev.domainService, apiKey: e.target.value }
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Domain-service root (optional)</Label>
                      <Input
                        value={form.domainService.root}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            domainService: { ...prev.domainService, root: e.target.value }
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Server IP (for DNS presets)</Label>
                      <Input
                        value={form.domainService.serverIp}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            domainService: { ...prev.domainService, serverIp: e.target.value }
                          }))
                        }
                      />
                    </div>
                    {isSubdomain && (
                      <div className="space-y-2 md:col-span-2">
                        <Label>Parent zone (apex domain)</Label>
                        <Input
                          placeholder="velvetdinosaur.com"
                          value={form.domainService.parentZone}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              domainService: { ...prev.domainService, parentZone: e.target.value }
                            }))
                          }
                        />
                        <p className="text-xs text-[var(--vd-muted-fg)]">
                          Subdomains are managed inside the parent zone. The installer can add A and
                          www CNAME records there if Web preset is enabled.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2 md:grid-cols-2">
                    {[
                      ['createZone', 'Create DNS zone'],
                      ['register', 'Register domain'],
                      ['import', 'Import domain'],
                      ['migrate', 'Migrate nameservers']
                    ].map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 text-sm">
                        <Switch
                          checked={form.domainService.actions[key as keyof WizardState['domainService']['actions']]}
                          disabled={
                            isSubdomain &&
                            ['createZone', 'postmark', 'register', 'import', 'migrate'].includes(
                              key
                            )
                          }
                          onCheckedChange={(checked) =>
                            setForm((prev) => ({
                              ...prev,
                              domainService: {
                                ...prev.domainService,
                                actions: {
                                  ...prev.domainService.actions,
                                  [key]: checked && !(isSubdomain && key !== 'webPreset')
                                }
                              }
                            }))
                          }
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                  {isSubdomain && (
                    <p className="text-xs text-[var(--vd-muted-fg)]">
                      For subdomains, only the Web preset is supported (A + www CNAME in the parent
                      zone).
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Repo URL (optional)</Label>
                  <Input
                    placeholder="git@github.com:org/repo.git"
                    value={form.app.repoUrl}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        app: { ...prev.app, repoUrl: e.target.value }
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Template path (optional)</Label>
                  <Input
                    placeholder="/opt/vdplatform/template"
                    value={form.app.templatePath}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        app: { ...prev.app, templatePath: e.target.value }
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={form.app.skipApp}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({
                        ...prev,
                        app: { ...prev.app, skipApp: checked }
                      }))
                    }
                  />
                  Skip app build
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={form.app.repair}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({
                        ...prev,
                        app: { ...prev.app, repair: checked }
                      }))
                    }
                  />
                  Repair install
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={form.infra.skipCertbot}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({
                        ...prev,
                        infra: { ...prev.infra, skipCertbot: checked }
                      }))
                    }
                  />
                  Skip certbot
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={form.infra.force}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({
                        ...prev,
                        infra: { ...prev.infra, force: checked }
                      }))
                    }
                  />
                  Force nginx overwrite
                </label>
              </div>

              <div className="space-y-2">
                <Label>Port override (optional)</Label>
                <Input
                  placeholder="3005"
                  value={form.infra.port}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      infra: { ...prev.infra, port: e.target.value }
                    }))
                  }
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3 text-sm">
              <p className="text-[var(--vd-muted-fg)]">
                Review the install request. Secrets are hidden and stored securely.
              </p>
              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[var(--vd-muted-fg)]">Domain</span>
                  <span>{form.site.domain}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[var(--vd-muted-fg)]">Slug</span>
                  <span>{form.site.slug}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[var(--vd-muted-fg)]">Admin email</span>
                  <span>{form.site.adminEmail}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[var(--vd-muted-fg)]">R2 mode</span>
                  <span>{form.r2.credentialMode}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[var(--vd-muted-fg)]">Domain-service</span>
                  <Badge className="bg-white text-[var(--vd-muted-fg)]">
                    {form.domainService.enabled ? 'enabled' : 'skipped'}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => setStep((prev) => Math.max(0, prev - 1))}
          disabled={step === 0 || busy}
        >
          Back
        </Button>
        <div className="flex items-center gap-2">
          {message ? <span className="text-xs text-[var(--vd-muted-fg)]">{message}</span> : null}
          {jobId ? (
            <Button asChild variant="outline">
              <Link href={`/admin/sites/jobs/${encodeURIComponent(jobId)}`}>
                View job log
              </Link>
            </Button>
          ) : null}
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep((prev) => prev + 1)} disabled={!canContinue}>
              Continue
            </Button>
          ) : (
            <Button onClick={() => void submit()} disabled={busy}>
              {busy ? 'Queuing...' : 'Run installer'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
