import { describe, it, expect, afterEach } from 'vitest';
import { setProductHiddenTool } from '../../../src/tools/mutations/set_product_hidden.js';
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

describe('set_product_hidden', () => {
  it('dry_run preview skips HTTP', async () => {
    const res = await setProductHiddenTool.handler(
      { product_id: 'guid-789', hidden: true, dry_run: true },
      ctx(),
    );
    expect((res as { _dry_run: boolean })._dry_run).toBe(true);
    expect((res as { would_set: { product_id: string; hidden: boolean } }).would_set).toEqual({
      product_id: 'guid-789',
      hidden: true,
    });
  });

  it('POSTs to /api/admin/feed-item/hidden with admin token', async () => {
    const scope = mockRevelor()
      .post('/api/admin/feed-item/hidden', { index: 'products', id: 'guid-789', hidden: true })
      .matchHeader('authorization', 'Bearer jwt.admin')
      .reply(200, { success: true, id: 'guid-789', hidden_manual: true });
    await setProductHiddenTool.handler(
      { product_id: 'guid-789', hidden: true, dry_run: false },
      ctx(),
    );
    expect(scope.isDone()).toBe(true);
  });

  it('also works for unhide (hidden=false)', async () => {
    const scope = mockRevelor()
      .post('/api/admin/feed-item/hidden', { index: 'products', id: 'guid-789', hidden: false })
      .matchHeader('authorization', 'Bearer jwt.admin')
      .reply(200, { success: true, id: 'guid-789', hidden_manual: false });
    await setProductHiddenTool.handler(
      { product_id: 'guid-789', hidden: false, dry_run: false },
      ctx(),
    );
    expect(scope.isDone()).toBe(true);
  });

  it('category is mutation', () => {
    expect(setProductHiddenTool.category).toBe('mutation');
  });
});
