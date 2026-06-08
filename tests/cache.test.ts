import { describe, it, expect, vi } from 'vitest';
import { TtlCache } from '../src/cache.js';

describe('TtlCache', () => {
  it('returns cached value within TTL', async () => {
    const cache = new TtlCache<number>(1000);
    const fn = vi.fn((): Promise<number> => Promise.resolve(42));
    expect(await cache.getOrSet('k', fn)).toBe(42);
    expect(await cache.getOrSet('k', fn)).toBe(42);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('refetches after TTL expires', async () => {
    vi.useFakeTimers();
    const cache = new TtlCache<number>(100);
    const fn = vi.fn((): Promise<number> => Promise.resolve(Math.random()));
    await cache.getOrSet('k', fn);
    vi.advanceTimersByTime(101);
    await cache.getOrSet('k', fn);
    expect(fn).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('TTL=0 means no cache', async () => {
    const cache = new TtlCache<number>(0);
    const fn = vi.fn((): Promise<number> => Promise.resolve(42));
    await cache.getOrSet('k', fn);
    await cache.getOrSet('k', fn);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
