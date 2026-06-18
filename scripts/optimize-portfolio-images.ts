import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORTFOLIO_DIR = path.join(ROOT, 'public', 'portfolio');
const SOURCE_FILES = ['asap.png', 'the-brave.png', 'rising-dust.png', 'scholardemia.png'] as const;
const WIDTHS = [432, 864, 1440] as const;

type GeneratedAsset = {
  source: string;
  output: string;
  width: number;
  height: number;
  bytes: number;
};

async function optimizeOne(sourceFile: string) {
  const sourcePath = path.join(PORTFOLIO_DIR, sourceFile);
  const source = sharp(sourcePath);
  const metadata = await source.metadata();
  const sourceWidth = metadata.width;

  if (!sourceWidth) {
    throw new Error(`Unable to read width for ${sourceFile}`);
  }

  const baseName = path.basename(sourceFile, path.extname(sourceFile));
  const generated: GeneratedAsset[] = [];

  for (const width of WIDTHS) {
    if (width > sourceWidth) continue;

    const resize = { width, withoutEnlargement: true };
    const webpOutput = path.join(PORTFOLIO_DIR, `${baseName}-${width}w.webp`);
    const avifOutput = path.join(PORTFOLIO_DIR, `${baseName}-${width}w.avif`);

    await sharp(sourcePath)
      .resize(resize)
      .webp({ quality: 82, effort: 6 })
      .toFile(webpOutput);

    await sharp(sourcePath)
      .resize(resize)
      .avif({ quality: 50, effort: 6 })
      .toFile(avifOutput);

    for (const output of [webpOutput, avifOutput]) {
      const outputMetadata = await sharp(output).metadata();
      const outputStat = await stat(output);
      generated.push({
        source: sourceFile,
        output: path.relative(ROOT, output),
        width: outputMetadata.width || 0,
        height: outputMetadata.height || 0,
        bytes: outputStat.size,
      });
    }
  }

  return generated;
}

async function main() {
  const generated = (await Promise.all(SOURCE_FILES.map((sourceFile) => optimizeOne(sourceFile)))).flat();

  for (const asset of generated) {
    const kb = Math.round(asset.bytes / 1024);
    console.log(`${asset.output} ${asset.width}x${asset.height} ${kb}KB (from ${asset.source})`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
