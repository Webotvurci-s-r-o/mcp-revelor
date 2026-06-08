import { describe, it, expect, afterEach } from 'vitest';
import { conversionStatsTool } from '../../../src/tools/readonly/conversion_stats.js';
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

describe('conversion_stats', () => {
  it('hits /v1/conversions', async () => {
    const scope = mockRevelor().get('/v1/conversions').query(true).reply(200, {
      sessions_with_search: 4321, sessions_without_search: 2876,
      conversion_rate_with_search: 0.082, conversion_rate_without_search: 0.041,
      search_lift_ratio: 2.0,
    });
    await conversionStatsTool.handler({}, ctx());
    expect(scope.isDone()).toBe(true);
  });
});
