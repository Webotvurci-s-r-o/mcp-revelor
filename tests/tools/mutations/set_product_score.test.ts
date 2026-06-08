import { describe, it, expect, afterEach } from 'vitest';
import { setProductScoreTool } from '../../../src/tools/mutations/set_product_score.js';
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

describe('set_product_score', () => {
  it('dry_run preview skips HTTP', async () => {
    const res = await setProductScoreTool.handler(
      { product_id: 'guid-456', manual_boost: 1.5, dry_run: true },
      ctx(),
    );
    expect((res as { _dry_run: boolean })._dry_run).toBe(true);
    expect((res as { would_set: { product_id: string; manual_boost: number } }).would_set).toEqual({
      product_id: 'guid-456',
      manual_boost: 1.5,
    });
  });

  it('POSTs to /api/admin/feed-item/score with admin token', async () => {
    const scope = mockRevelor()
      .post('/api/admin/feed-item/score', { index: 'products', id: 'guid-456', manual_boost: 2.0 })
      .matchHeader('authorization', 'Bearer jwt.admin')
      .reply(200, { success: true, id: 'guid-456', manual_boost: 2.0 });
    await setProductScoreTool.handler(
      { product_id: 'guid-456', manual_boost: 2.0, dry_run: false },
      ctx(),
    );
    expect(scope.isDone()).toBe(true);
  });

  it('rejects manual_boost out of range', () => {
    const result = setProductScoreTool.inputSchema.safeParse({
      product_id: 'guid-456',
      manual_boost: 0.05,
    });
    expect(result.success).toBe(false);
  });

  it('category is mutation', () => {
    expect(setProductScoreTool.category).toBe('mutation');
  });
});
