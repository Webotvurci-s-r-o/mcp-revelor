import { describe, it, expect } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, join, dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOOLS_DIR = resolve(__dirname, '..', 'src', 'tools');

async function* walk(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else if (entry.name.endsWith('.ts')) yield p;
  }
}

describe('no DELETE invariant (security)', () => {
  it('no tool source file calls client.delete or HTTP DELETE', async () => {
    const offenders: string[] = [];
    for await (const file of walk(TOOLS_DIR)) {
      const content = await readFile(file, 'utf-8');
      if (/\bclient\.delete\b|method:\s*['"]DELETE['"]|\.delete\(/i.test(content)) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('no tool source mentions "replace-bulk" or "delete-bulk" endpoints', async () => {
    const offenders: string[] = [];
    for await (const file of walk(TOOLS_DIR)) {
      const content = await readFile(file, 'utf-8');
      if (/replace-bulk|delete-bulk/i.test(content)) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });

  it('no tool source references excluded endpoints', async () => {
    const FORBIDDEN = [
      '/api/admin/excluded-ips',
      '/sharing/import',
      '/api/admin/public-api-keys',
    ];
    const offenders: { file: string; pattern: string }[] = [];
    for await (const file of walk(TOOLS_DIR)) {
      const content = await readFile(file, 'utf-8');
      for (const f of FORBIDDEN) {
        if (content.includes(f)) offenders.push({ file, pattern: f });
      }
    }
    expect(offenders).toEqual([]);
  });
});
