import { describe, it, expect } from 'vitest';
import { loadFixture } from '../src/mock/fixture_loader.js';

describe('loadFixture', () => {
  it('loads JSON by tool name', async () => {
    const data = await loadFixture('_test');
    expect(data).toEqual({ hello: 'world' });
  });
  it('throws on missing fixture', async () => {
    await expect(loadFixture('nonexistent')).rejects.toThrow(/fixture/i);
  });
});
