type Entry<V> = { value: V; expiresAt: number };

export class TtlCache<V> {
  private store = new Map<string, Entry<V>>();
  constructor(private readonly ttlMs: number) {}

  async getOrSet(key: string, fn: () => Promise<V>): Promise<V> {
    if (this.ttlMs <= 0) return fn();
    const hit = this.store.get(key);
    if (hit && hit.expiresAt > Date.now()) return hit.value;
    const value = await fn();
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    return value;
  }

  clear(): void {
    this.store.clear();
  }
}
