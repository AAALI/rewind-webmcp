import { cp, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const source = resolve(root, 'sdk-dist');
const target = resolve(root, 'dist', 'sdk');

if (!existsSync(source)) {
  console.warn('sdk-dist/ not found; skipping SDK copy.');
  process.exit(0);
}

await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true, force: true });
console.log(`Copied SDK bundle to ${target}`);
