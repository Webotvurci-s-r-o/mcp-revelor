import { describe, it, expect, afterEach } from 'vitest';
import { updateCtrWeightsTool } from '../../../src/tools/mutations/update_ctr_weights.js';
import { mockRevelor, cleanup } from '../../helpers/mock_revelor.js';
import { createHttpClient } from '../../../src/http_client.js';
import { TtlCache } from '../../../src/cache.js';

afterEach(cleanup);
const ctx = () => ({
  client: createHttpClient({
    baseUrl: 'https://test.revelor.cz', apiKey: 'rvlr_x',
    adminToken: 'jwt.admin', tenantId: '123456', httpTimeoutMs: 1000,
  }),
  mode: 'full' as const,
  cache: new TtlCache(0),
  tenantId: '123456',
});

describe('update_ctr_weights', () => {
  it('dry_run preview', async () => {
    const res = await updateCtrWeightsTool.handler({ click_weight: 1.5, dry_run: true }, ctx());
    expect((res as { _dry_run: boolean })._dry_run).toBe(true);
  });
  it('POSTs to /api/admin/ctr-settings with admin auth', async () => {
    const scope = mockRevelor()
      .post('/api/admin/ctr-settings', { click_weight: 1.5, availability_weight: 1.0 })
      .matchHeader('authorization', 'Bearer jwt.admin')
      .reply(200, { click_weight: 1.5, availability_weight: 1.0, updated_at: '2026-05-14T10:30:00Z' });
    await updateCtrWeightsTool.handler({ click_weight: 1.5, availability_weight: 1.0, dry_run: false }, ctx());
    expect(scope.isDone()).toBe(true);
  });
  it('safeParse fails when no weights provided', () => {
    const result = updateCtrWeightsTool.inputSchema.safeParse({ dry_run: false });
    expect(result.success).toBe(false);
  });
});
