import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = resolve(__dirname, '..', '..', 'fixtures');

export async function loadFixture<T = unknown>(toolName: string): Promise<T> {
  const path = resolve(FIXTURES_DIR, `${toolName}.json`);
  try {
    const raw = await readFile(path, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (e) {
    throw new Error(`Fixture not found: ${toolName}.json — ${(e as Error).message}`);
  }
}
