import { expect, test } from 'bun:test';
import { AsyncLocalStorage } from 'node:async_hooks';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { GetObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Effect } from 'effect';
import mongoose from 'mongoose';
import Bold from '@tiptap/extension-bold';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { generateHTML, generateJSON } from '@tiptap/html/server';
import { Client as FtpClient } from 'basic-ftp';
import katex from 'katex';
// Exercise the installed package, rather than Bun's built-in Undici shim.
import { Agent, fetch as undiciFetch } from 'undici/index.js';
import { createRouteHandler, createUploadthing, UploadThingError } from 'uploadthing/server';

test('Mongoose neutralizes selectors nested inside $nor', () => {
  const input = { $nor: [{ email: { $ne: null } }] };
  expect(mongoose.sanitizeFilter(input)).toEqual({
    $nor: [{ email: { $eq: { $ne: null } } }]
  });
});

test('updated S3 client parses XML and preserves signed download restrictions', async () => {
  const client = new S3Client({
    region: 'auto',
    endpoint: 'https://storage.example.test',
    credentials: { accessKeyId: 'test-access', secretAccessKey: 'test-secret' },
    requestHandler: {
      async handle() {
        return { response: { statusCode: 200, headers: { 'content-type': 'application/xml' },
          body: Readable.from(['<ListBucketResult><Name>test-bucket</Name><IsTruncated>false</IsTruncated><Contents><Key>uploads/a&amp;b.png</Key><Size>42</Size></Contents></ListBucketResult>']) } };
      }
    }
  });
  try {
    const result = await client.send(new ListObjectsV2Command({ Bucket: 'test-bucket' }));
    expect(result.Contents?.[0]).toMatchObject({ Key: 'uploads/a&b.png', Size: 42 });
    const url = new URL(await getSignedUrl(client, new GetObjectCommand({
      Bucket: 'test-bucket', Key: 'uploads/report.pdf',
      ResponseContentDisposition: 'attachment', ResponseContentType: 'application/octet-stream'
    }), { expiresIn: 900 }));
    expect(url.searchParams.get('response-content-disposition')).toBe('attachment');
    expect(url.searchParams.get('response-content-type')).toBe('application/octet-stream');
    expect(url.searchParams.get('X-Amz-Expires')).toBe('900');
    expect(url.searchParams.get('X-Amz-Signature')).toMatch(/^[a-f0-9]{64}$/);
  } finally { client.destroy(); }
});

test('Undici override retains the Agent/fetch API used by AI downloads', async () => {
  const server = createServer((request, response) => {
    if (request.url === '/redirect') {
      response.writeHead(302, { location: '/content' });
      response.end();
    } else {
      response.setHeader('content-type', 'text/plain');
      response.end('test download');
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing test address');
  const agent = new Agent({ connect: { timeout: 1000 } });
  try {
    const response = await undiciFetch(`http://127.0.0.1:${address.port}/redirect`, {
      dispatcher: agent, redirect: 'manual'
    });
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/content');
    await response.body?.cancel();
    const content = await undiciFetch(`http://127.0.0.1:${address.port}/content`, { dispatcher: agent });
    expect(await content.text()).toBe('test download');
  } finally {
    await agent.close();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});

test('Effect preserves separate request contexts during concurrent async work', async () => {
  const contexts = new AsyncLocalStorage<string>();
  const run = (id: string, duration: number) => contexts.run(id, () => Effect.runPromise(
    Effect.gen(function* () {
      yield* Effect.sleep(duration);
      return contexts.getStore();
    })
  ));
  expect(await Promise.all([run('first', 10), run('second', 1)])).toEqual(['first', 'second']);
});

test('Effect platform override keeps the UploadThing upload route working', async () => {
  // uploadthing pins @effect/platform 0.90.3 and builds its route handler and its calls to the upload
  // service on it. The handler gets a recording fetch, so no request leaves this process.
  const outbound: Array<{ method?: string; url: string; body: unknown }> = [];
  const f = createUploadthing();
  const handler = createRouteHandler({
    router: {
      refused: f(['image']).middleware(() => { throw new UploadThingError('Unauthorized'); }).onUploadComplete(() => undefined),
      accepted: f(['image']).middleware(() => ({ userId: 'test-user' })).onUploadComplete(() => undefined)
    },
    config: {
      token: Buffer.from(JSON.stringify({ apiKey: 'sk_test_key', appId: 'test-app', regions: ['fra1'] })).toString('base64'),
      isDev: false,
      logLevel: 'None',
      fetch: async (input, init) => {
        outbound.push({ method: init?.method, url: String(input), body: await new Response(init?.body as BodyInit).json() });
        return Response.json({ ok: true });
      }
    }
  });
  const upload = (slug: string) => handler(new Request(`http://localhost/api/uploadthing?actionType=upload&slug=${slug}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ files: [{ name: 'photo.png', size: 1024, type: 'image/png' }], input: null })
  }));

  const routes = await handler(new Request('http://localhost/api/uploadthing'));
  expect(routes.headers.get('x-uploadthing-version')).toMatch(/^7\./);
  expect(await routes.json()).toMatchObject([{ slug: 'refused' }, { slug: 'accepted' }]);

  const refused = await upload('refused');
  expect(refused.status).toBe(500);
  expect(await refused.json()).toEqual({ message: 'Unauthorized' });
  expect(outbound).toEqual([]);

  const accepted = await upload('accepted');
  expect(accepted.status).toBe(200);
  const [presigned] = await accepted.json() as Array<{ key: string; name: string; url: string }>;
  expect(presigned.name).toBe('photo.png');
  expect(new URL(presigned.url).host).toBe('fra1.ingest.uploadthing.com');
  expect(outbound).toHaveLength(1);
  expect(outbound[0]).toMatchObject({
    method: 'POST',
    url: 'https://fra1.ingest.uploadthing.com/route-metadata',
    body: { fileKeys: [presigned.key], metadata: { userId: 'test-user' }, callbackSlug: 'accepted' }
  });
});

test('happy-dom 21 override keeps server-side rich text rendering working', () => {
  // Puck renders rich text on the server through @tiptap/html, which runs on happy-dom.
  const extensions = [Document, Paragraph, Text, Bold];
  const doc = { type: 'doc', content: [{ type: 'paragraph', content: [
    { type: 'text', text: 'Global ' },
    { type: 'text', text: 'justice', marks: [{ type: 'bold' }] }
  ] }] };
  expect(generateHTML(doc, extensions)).toBe('<p>Global <strong>justice</strong></p>');
  expect(generateJSON('<p>Global <strong>justice</strong><script>alert(1)</script></p>', extensions)).toEqual(doc);
});

test('KaTeX override renders equations the way the Plate math plugin calls it', () => {
  expect(katex.renderToString('E = mc^2', { displayMode: true, throwOnError: false })).toContain('class="katex-display"');
  expect(katex.renderToString('\\frac{1}{', { throwOnError: false })).toContain('katex-error');
});

test('basic-ftp override keeps the client API used by proxy-agent FTP support', () => {
  const client = new FtpClient();
  for (const method of ['access', 'close', 'downloadTo', 'lastMod', 'list'] as const) {
    expect(typeof client[method]).toBe('function');
  }
  client.close();
});

test('the audit exception for zod 3 does not cover the application zod', () => {
  // audit:dependencies ignores GHSA-mrhx-c7xc-m3w5 because tweakcn-ui and tooling need zod 3, which has
  // no fix. An ignore applies to every copy, so this keeps the application's own zod on a fixed release.
  const { version } = JSON.parse(readFileSync('node_modules/zod/package.json', 'utf8')) as { version: string };
  const [major, minor, patch] = version.split('.').map(Number);
  expect(major).toBe(4);
  expect(minor > 6 || (minor === 6 && patch >= 6)).toBe(true);
});
