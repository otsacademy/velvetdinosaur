import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { requireInstallerAdmin } from '@/lib/admin';
import { createInstallerJob, listInstallerJobs } from '@/lib/installer-jobs';
import { z } from 'zod';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
  Pragma: 'no-cache',
  Expires: '0'
};

const MAX_BODY_BYTES = 200 * 1024;

const installerJobSchema = z
  .object({
    site: z.object({
      domain: z.string(),
      slug: z.string(),
      adminEmail: z.string()
    }),
    r2: z
      .object({
        credentialMode: z.string().optional(),
        cloudflareMode: z.string().optional(),
        cloudflareAccountId: z.string().optional(),
        cloudflareApiToken: z.string().optional(),
        cloudflareTokenMinter: z.string().optional(),
        accessKeyId: z.string().optional(),
        secretAccessKey: z.string().optional(),
        jurisdiction: z.string().optional(),
        rotateToken: z.union([z.boolean(), z.string()]).optional(),
        useExistingCreds: z.union([z.boolean(), z.string()]).optional()
      })
      .optional(),
    domainService: z
      .object({
        enabled: z.union([z.boolean(), z.string()]).optional(),
        url: z.string().optional(),
        root: z.string().optional(),
        serverIp: z.string().optional(),
        apiKey: z.string().optional(),
        actions: z
          .object({
            createZone: z.union([z.boolean(), z.string()]).optional(),
            webPreset: z.union([z.boolean(), z.string()]).optional(),
            postmark: z.union([z.boolean(), z.string()]).optional(),
            register: z.union([z.boolean(), z.string()]).optional(),
            import: z.union([z.boolean(), z.string()]).optional(),
            migrate: z.union([z.boolean(), z.string()]).optional()
          })
          .optional()
      })
      .optional(),
    app: z
      .object({
        repoUrl: z.string().optional(),
        templatePath: z.string().optional(),
        skipApp: z.union([z.boolean(), z.string()]).optional(),
        repair: z.union([z.boolean(), z.string()]).optional()
      })
      .optional(),
    infra: z
      .object({
        port: z.union([z.number(), z.string()]).optional(),
        skipCertbot: z.union([z.boolean(), z.string()]).optional(),
        force: z.union([z.boolean(), z.string()]).optional()
      })
      .optional(),
    googleFontsApiKey: z.string().optional()
  })
  .passthrough();

function isHttpsRequest(request: Request) {
  const forwardedProto = request.headers.get('x-forwarded-proto');
  if (forwardedProto) {
    return forwardedProto.split(',')[0]?.trim().toLowerCase() === 'https';
  }
  return new URL(request.url).protocol === 'https:';
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeDomain(value: string) {
  return value.trim().toLowerCase();
}

function toBool(value: unknown) {
  return value === true || value === 'true';
}

function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export async function GET(request: Request) {
  unstable_noStore();
  if (!isHttpsRequest(request)) {
    return NextResponse.json({ error: 'HTTPS required' }, { status: 400, headers: NO_STORE_HEADERS });
  }
  const gate = await requireInstallerAdmin(request.headers);
  if (!gate.ok) {
    return NextResponse.json({ error: 'Forbidden' }, { status: gate.status, headers: NO_STORE_HEADERS });
  }
  const jobs = await listInstallerJobs();
  return NextResponse.json({ jobs }, { headers: NO_STORE_HEADERS });
}

export async function POST(request: Request) {
  if (!isHttpsRequest(request)) {
    return NextResponse.json({ error: 'HTTPS required' }, { status: 400, headers: NO_STORE_HEADERS });
  }
  const gate = await requireInstallerAdmin(request.headers);
  if (!gate.ok) {
    return NextResponse.json({ error: 'Forbidden' }, { status: gate.status, headers: NO_STORE_HEADERS });
  }

  const contentLength = request.headers.get('content-length');
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413, headers: NO_STORE_HEADERS });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = installerJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const parsedBody = parsed.data;
  const site = parsedBody.site || {};
  const domain = normalizeDomain(site.domain || '');
  const slug = normalizeSlug(site.slug || '');
  const adminEmail = String(site.adminEmail || '').trim().toLowerCase();

  if (!domain || !slug || !adminEmail) {
    return NextResponse.json(
      { error: 'Missing required fields (domain, slug, adminEmail)' },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const r2 = parsedBody?.r2 || {};
  const r2Mode = String(r2.credentialMode || 'mint');
  const cfMode = String(r2.cloudflareMode || 'default');

  const cloudflare = {
    mode: cfMode,
    accountId: String(r2.cloudflareAccountId || '').trim(),
    apiToken: String(r2.cloudflareApiToken || '').trim(),
    tokenMinter: String(r2.cloudflareTokenMinter || '').trim()
  };

  const r2Creds = {
    accessKeyId: String(r2.accessKeyId || '').trim(),
    secretAccessKey: String(r2.secretAccessKey || '').trim()
  };

  const domainService = parsedBody?.domainService || {};
  const domainServiceActions = domainService?.actions || {};

  const googleFontsApiKey = String(parsedBody?.googleFontsApiKey || '').trim();
  const defaultGoogleFontsApiKey = String(
    process.env.GOOGLE_FONTS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_FONTS_API_KEY || ''
  ).trim();
  const effectiveGoogleFontsApiKey = googleFontsApiKey || defaultGoogleFontsApiKey;

  const input = {
    site: { domain, slug, adminEmail },
    r2: {
      jurisdiction: String(r2.jurisdiction || 'default'),
      credentialMode: r2Mode,
      rotateToken: toBool(r2.rotateToken),
      useExistingCreds: toBool(r2.useExistingCreds),
      cloudflareMode: cfMode
    },
    domainService: {
      enabled: toBool(domainService.enabled),
      url: String(domainService.url || '').trim(),
      root: String(domainService.root || '').trim(),
      serverIp: String(domainService.serverIp || '').trim(),
      actions: {
        createZone: toBool(domainServiceActions.createZone),
        webPreset: toBool(domainServiceActions.webPreset),
        postmark: toBool(domainServiceActions.postmark),
        register: toBool(domainServiceActions.register),
        import: toBool(domainServiceActions.import),
        migrate: toBool(domainServiceActions.migrate)
      }
    },
    app: {
      repoUrl: String(parsedBody?.app?.repoUrl || '').trim(),
      templatePath: String(parsedBody?.app?.templatePath || '').trim(),
      skipApp: toBool(parsedBody?.app?.skipApp),
      repair: toBool(parsedBody?.app?.repair)
    },
    infra: {
      port: toNumber(parsedBody?.infra?.port),
      skipCertbot: toBool(parsedBody?.infra?.skipCertbot),
      force: toBool(parsedBody?.infra?.force)
    },
    googleFontsApiKey: effectiveGoogleFontsApiKey
  };

  const secrets: Record<string, unknown> = {};
  if (cloudflare.mode === 'custom') {
    secrets.cloudflareAccountId = cloudflare.accountId;
    secrets.cloudflareApiToken = cloudflare.apiToken;
    if (cloudflare.tokenMinter) {
      secrets.cloudflareTokenMinter = cloudflare.tokenMinter;
    }
  }
  if (r2Mode === 'explicit') {
    secrets.r2AccessKeyId = r2Creds.accessKeyId;
    secrets.r2SecretAccessKey = r2Creds.secretAccessKey;
  }
  if (domainService?.apiKey) {
    secrets.domainServiceApiKey = String(domainService.apiKey || '').trim();
  }
  if (input.googleFontsApiKey) {
    secrets.googleFontsApiKey = input.googleFontsApiKey;
  }

  const sessionUser = (gate.session as { user?: { email?: string; id?: string } })?.user;

  let job;
  try {
    job = await createInstallerJob({
      site: { slug, domain },
      createdBy: { email: sessionUser?.email, id: sessionUser?.id },
      input,
      secrets
    });
  } catch {
    return NextResponse.json({ error: 'Failed to create installer job' }, { status: 500, headers: NO_STORE_HEADERS });
  }

  return NextResponse.json({ job }, { headers: NO_STORE_HEADERS });
}
