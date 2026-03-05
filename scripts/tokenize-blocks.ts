import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const TARGET_EXTENSIONS = new Set(['.ts', '.tsx']);

const REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bbg-white\/(\d{1,3})\b/g, 'bg-[color-mix(in_oklch,var(--vd-card)_$1%,transparent)]'],
  [/\bbg-white\b/g, 'bg-[var(--vd-card)]'],
  [/\bbg-gray-(50|100)\b/g, 'bg-[var(--vd-muted)]'],
  [/\bbg-neutral-(50|100)\b/g, 'bg-[var(--vd-muted)]'],
  [/\bbg-neutral-200\b/g, 'bg-[var(--vd-muted)]'],
  [/\bbg-neutral-900\b/g, 'bg-[var(--vd-inverse-bg)]'],
  [/\bbg-slate-(50|100)\b/g, 'bg-[var(--vd-muted)]'],
  [/\bbg-zinc-(50|100)\b/g, 'bg-[var(--vd-muted)]'],
  [/\bbg-black\b/g, 'bg-[var(--vd-fg)]'],
  [/\btext-black\b/g, 'text-[var(--vd-fg)]'],
  [/\bbg-brand-dark\b/g, 'bg-[var(--vd-inverse-bg)]'],
  [/\bfrom-brand-dark\/(\d{1,3})\b/g, 'from-[color-mix(in_oklch,var(--vd-inverse-bg)_$1%,transparent)]'],
  [/\bvia-brand-dark\/(\d{1,3})\b/g, 'via-[color-mix(in_oklch,var(--vd-inverse-bg)_$1%,transparent)]'],
  [/\bto-brand-dark\/(\d{1,3})\b/g, 'to-[color-mix(in_oklch,var(--vd-inverse-bg)_$1%,transparent)]'],
  [/\btext-gray-(900|800)\b/g, 'text-[var(--vd-fg)]'],
  [/\btext-neutral-(900|800)\b/g, 'text-[var(--vd-fg)]'],
  [/\btext-slate-(900|800)\b/g, 'text-[var(--vd-fg)]'],
  [/\btext-zinc-(900|800)\b/g, 'text-[var(--vd-fg)]'],
  [/\btext-gray-200\b/g, 'text-[color-mix(in_oklch,var(--vd-inverse-fg)_85%,transparent)]'],
  [/\btext-gray-100\b/g, 'text-[var(--vd-inverse-fg)]'],
  [/\btext-gray-(700|600|500|400|300)\b/g, 'text-[var(--vd-muted-fg)]'],
  [/\btext-neutral-(700|600|500|400|300)\b/g, 'text-[var(--vd-muted-fg)]'],
  [/\btext-slate-(700|600|500|400|300)\b/g, 'text-[var(--vd-muted-fg)]'],
  [/\btext-zinc-(700|600|500|400|300)\b/g, 'text-[var(--vd-muted-fg)]'],
  [/\btext-white\/(\d{1,3})\b/g, 'text-[color-mix(in_oklch,var(--vd-inverse-fg)_$1%,transparent)]'],
  [/\btext-white\b/g, 'text-[var(--vd-inverse-fg)]'],
  [/\bborder-gray-(100|200|300)\b/g, 'border-[var(--vd-border)]'],
  [/\bborder-neutral-(100|200|300)\b/g, 'border-[var(--vd-border)]'],
  [/\bborder-slate-(100|200|300)\b/g, 'border-[var(--vd-border)]'],
  [/\bborder-zinc-(100|200|300)\b/g, 'border-[var(--vd-border)]'],
  [/\bborder-white\/(\d{1,3})\b/g, 'border-[color-mix(in_oklch,var(--vd-inverse-fg)_$1%,transparent)]'],
  [/\bborder-white\b/g, 'border-[color-mix(in_oklch,var(--vd-inverse-fg)_40%,transparent)]'],
  [/\btext-brand-dark\b/g, 'text-[var(--vd-fg)]'],
  [/\btext-brand-orange\b/g, 'text-[var(--vd-primary)]'],
  [/\btext-brand-gray\b/g, 'text-[var(--vd-muted-fg)]'],
  [/\bbg-brand-orange\b/g, 'bg-[var(--vd-primary)]'],
  [/\bbg-brand-gray\b/g, 'bg-[var(--vd-muted)]'],
  [/\bborder-brand-orange\b/g, 'border-[var(--vd-primary)]'],
  [/\bborder-brand-gray\b/g, 'border-[var(--vd-border)]'],
  [/\bbg-orange-100\b/g, 'bg-[color-mix(in_oklch,var(--vd-primary)_15%,transparent)]'],
  [/\bhover:bg-orange-700\b/g, 'hover:bg-[color-mix(in_oklch,var(--vd-primary)_80%,var(--vd-fg))]'],
  [/\bhover:bg-orange-600\b/g, 'hover:bg-[color-mix(in_oklch,var(--vd-primary)_75%,var(--vd-fg))]'],
  [/\bhover:text-orange-700\b/g, 'hover:text-[color-mix(in_oklch,var(--vd-primary)_80%,var(--vd-fg))]']
];

async function walk(dir: string, files: string[] = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, files);
      continue;
    }
    const ext = entry.name.slice(entry.name.lastIndexOf('.'));
    if (TARGET_EXTENSIONS.has(ext)) {
      files.push(full);
    }
  }
  return files;
}

function applyReplacements(input: string) {
  let output = input;
  for (const [pattern, replacement] of REPLACEMENTS) {
    output = output.replace(pattern, replacement);
  }
  return output;
}

async function processDir(dir: string) {
  const files = await walk(dir);
  for (const file of files) {
    const raw = await readFile(file, 'utf8');
    const updated = applyReplacements(raw);
    if (updated !== raw) {
      await writeFile(file, updated, 'utf8');
    }
  }
}

const dirs = process.argv.slice(2);
if (dirs.length === 0) {
  throw new Error('Provide one or more directories to tokenize.');
}

for (const dir of dirs) {
  await processDir(dir);
}
