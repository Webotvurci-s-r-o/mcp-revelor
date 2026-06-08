import { describe, it, expect, afterEach } from 'vitest';
import { searchLogsTool } from '../../../src/tools/readonly/search_logs.js';
import { mockRevelor, cleanup } from '../../helpers/mock_revelor.js';
import { createHttpClient } from '../../../src/http_client.js';
import { TtlCache } from '../../../src/cache.js';

afterEach(cleanup);
const ctx = () => ({
  client: createHttpClient({
    baseUrl: 'https://test.revelor.cz', apiKey: 'rvlr_x',
    adminToken: 'jwt.admin', tenantId: '123456', httpTimeoutMs: 1000,
  }),
  mode: 'readonly' as const,
  cache: new TtlCache(0),
  tenantId: '123456',
});

describe('search_logs', () => {
  it('hits /v1/search-logs', async () => {
    const scope = mockRevelor()
      .get('/v1/search-logs')
      .query(true)
      .reply(200, { logs: [], total: 0, limit: 50, offset: 0 });
    await searchLogsTool.handler({ limit: 50, offset: 0, zero_results_only: false }, ctx());
    expect(scope.isDone()).toBe(true);
  });

  it('rejects range > 90 days', () => {
    const result = searchLogsTool.inputSchema.safeParse({ from: '2026-01-01', to: '2026-12-31' });
    expect(result.success).toBe(false);
  });
});
