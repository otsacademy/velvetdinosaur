import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { z } from 'zod';

const gateSchema = z.object({
  name: z.string().min(1),
  command: z.string().min(1)
});

const targetSchema = z.object({
  name: z.string().min(1),
  kind: z.enum(['site', 'admin', 'package']),
  gates: z.array(gateSchema).min(1)
});

const manifestSchema = z.object({
  version: z.number().int().positive(),
  targets: z.array(targetSchema).min(1)
});

function parseArgs(argv: string[]) {
  const args = new Map<string, string | boolean>();

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg) continue;

    if (arg === '--all') {
      args.set('all', true);
      continue;
    }
    if (arg === '--only') {
      args.set('only', argv[index + 1] || '');
      index += 1;
      continue;
    }
    if (arg === '--validate') {
      args.set('validate', true);
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      args.set('help', true);
    }
  }

  return args;
}

async function runShell(command: string) {
  return await new Promise<number>((resolve, reject) => {
    const child = spawn('bash', ['-lc', command], {
      stdio: 'inherit',
      env: { ...process.env }
    });
    child.on('error', reject);
    child.on('close', (code) => resolve(code ?? 0));
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.get('help')) {
    console.log('Usage: bun run quality --only <target> | --all | --validate');
    process.exit(0);
  }

  const raw = await readFile(new URL('../quality/gates.json', import.meta.url), 'utf8');
  const parsed = JSON.parse(raw) as unknown;
  const manifest = manifestSchema.parse(parsed);

  const only = String(args.get('only') || '').trim();
  const runAll = Boolean(args.get('all')) || !only;

  if (args.get('validate')) {
    const targetNames = new Set<string>();
    for (const target of manifest.targets) {
      if (targetNames.has(target.name)) {
        throw new Error(`Duplicate target name: ${target.name}`);
      }
      targetNames.add(target.name);

      const gateNames = new Set<string>();
      for (const gate of target.gates) {
        if (gateNames.has(gate.name)) {
          throw new Error(`Duplicate gate name in target "${target.name}": ${gate.name}`);
        }
        gateNames.add(gate.name);
      }
    }

    console.log(`quality/gates.json OK (version=${manifest.version}, targets=${manifest.targets.length})`);
    return;
  }

  const targets = runAll ? manifest.targets : manifest.targets.filter((target) => target.name === only);
  if (targets.length === 0) {
    const known = manifest.targets.map((target) => target.name).join(', ');
    throw new Error(`Unknown target "${only}". Known targets: ${known || '(none)'}`);
  }

  for (const target of targets) {
    console.log(`\n== quality: ${target.name} (${target.kind}) ==`);
    for (const gate of target.gates) {
      console.log(`\n-- gate: ${gate.name} --\n$ ${gate.command}`);
      const code = await runShell(gate.command);
      if (code !== 0) {
        throw new Error(`Gate "${gate.name}" failed for target "${target.name}" (exit ${code})`);
      }
    }
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
