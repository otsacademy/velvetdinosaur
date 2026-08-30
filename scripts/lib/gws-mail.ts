/**
 * Shared GWS (Google Workspace) mail sender.
 *
 * Drives the gws-mcp connector over stdio JSON-RPC: create a draft, then send
 * it. Extracted from demo-fleet-activity-digest.ts so the fleet health monitor
 * can reuse the same delivery path and account.
 */

export const GWS_BINARY_DEFAULT =
  process.env.VD_GWS_BINARY || '/home/ianw/.gemini/extensions/gws-connector/bin/gws-mcp';
export const GWS_ACCOUNT_DEFAULT = process.env.VD_GWS_ACCOUNT || 'ian-ota';

type JsonRpcResponse = {
  id?: number;
  result?: {
    content?: Array<{ type?: string; text?: string }>;
    isError?: boolean;
  };
  error?: { code?: number; message?: string };
};

export type GwsMailOptions = {
  subject: string;
  body: string;
  recipient: string;
  account?: string;
  binary?: string;
  clientName?: string;
};

export async function sendGwsEmail(options: GwsMailOptions) {
  const binary = options.binary || GWS_BINARY_DEFAULT;
  const account = options.account || GWS_ACCOUNT_DEFAULT;
  const clientName = options.clientName || 'vd-gws-mail';

  const process = Bun.spawn([binary, '--use-dot-names'], {
    stdin: 'pipe',
    stdout: 'pipe',
    stderr: 'pipe',
    env: { ...Bun.env, HOME: Bun.env.HOME || '/home/ianw' }
  });
  const pending = new Map<number, (response: JsonRpcResponse) => void>();
  let sequence = 0;
  let buffer = '';

  const pump = (async () => {
    const reader = process.stdout.getReader();
    const decoder = new TextDecoder();
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newline = buffer.indexOf('\n');
      while (newline >= 0) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (line) {
          const response = JSON.parse(line) as JsonRpcResponse;
          if (response.id && pending.has(response.id)) {
            pending.get(response.id)?.(response);
            pending.delete(response.id);
          }
        }
        newline = buffer.indexOf('\n');
      }
    }
  })();

  function write(message: object) {
    process.stdin.write(`${JSON.stringify(message)}\n`);
  }

  async function call(method: string, params: object) {
    const id = ++sequence;
    const response = await new Promise<JsonRpcResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`GWS ${method} timed out`));
      }, 30_000);
      pending.set(id, (value) => {
        clearTimeout(timer);
        resolve(value);
      });
      write({ jsonrpc: '2.0', id, method, params });
    });
    if (response.error) throw new Error(response.error.message || `GWS ${method} failed`);
    const text = response.result?.content?.map((item) => item.text || '').join('\n') || '';
    if (response.result?.isError) throw new Error(text || `GWS ${method} failed`);
    return text;
  }

  try {
    await call('initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: clientName, version: '1.0.0' }
    });
    write({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} });
    const created = await call('tools/call', {
      name: 'gws.mail.create_draft',
      arguments: { account, to: options.recipient, subject: options.subject, body: options.body }
    });
    const draftId = created.match(/Draft ID:\s*(\S+)/)?.[1];
    if (!draftId) throw new Error(`GWS did not return a draft ID: ${created}`);
    const sent = await call('tools/call', {
      name: 'gws.mail.send_draft',
      arguments: { account, draftId }
    });
    if (!/Email sent from/.test(sent)) throw new Error(`GWS did not confirm delivery: ${sent}`);
    return sent;
  } finally {
    process.stdin.end();
    await Promise.race([pump, Bun.sleep(1000)]).catch(() => {});
    if (process.exitCode === null) process.kill();
  }
}
