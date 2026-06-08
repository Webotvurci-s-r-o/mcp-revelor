import { describe, it, expect, afterEach } from 'vitest';
import { pinTopItemTool } from '../../../src/tools/mutations/pin_top_item.js';
import { mockRevelor, cleanup } from '../../helpers/mock_revelor.js';
import { createHttpClient } from '../../../src/http_client.js';
import { TtlCache } from '../../../src/cache.js';

afterEach(cleanup);
const ctx = () => ({
  client: createHttpClient({
    baseUrl: 'https://test.revelor.cz',
    apiKey: 'rvlr_x',
    adminToken: 'jwt.admin',
    tenantId: '123456',
    httpTimeoutMs: 1000,
  }),
  mode: 'full' as const,
  cache: new TtlCache(0),
  tenantId: '123456',
});

describe('pin_top_item tool', () => {
  it('dry_run returns preview without HTTP call', async () => {
    const res = await pinTopItemTool.handler(
      { entity_type: 'products', entity_id: 'guid-abc', position: 3, dry_run: true },
      ctx(),
    );
    expect(res).toMatchObject({ _dry_run: true });
    expect((res as { would_pin: { entity_id: string; position: number } }).would_pin).toEqual({
      entity_type: 'products',
      entity_id: 'guid-abc',
      position: 3,
    });
  });

  it('actual call POSTs to /top-items', async () => {
    const scope = mockRevelor()
      .post('/top-items', (body: Record<string, unknown>) => body.entity_type === 'products' && body.position === 3)
      .reply(201, { id: 'products:guid-abc', position: 3 });
    const res = await pinTopItemTool.handler(
      { entity_type: 'products', entity_id: 'guid-abc', position: 3, dry_run: false },
      ctx(),
    );
    expect((res as { id: string }).id).toBe('products:guid-abc');
    expect(scope.isDone()).toBe(true);
  });

  it('category is mutation', () => {
    expect(pinTopItemTool.category).toBe('mutation');
  });

  it('rejects position out of range', () => {
    const result = pinTopItemTool.inputSchema.safeParse({ entity_type: 'products', entity_id: 'x', position: 11 });
    expect(result.success).toBe(false);
  });
});
