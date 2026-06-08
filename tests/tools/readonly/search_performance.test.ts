import { describe, it, expect, afterEach } from 'vitest';
import { searchPerformanceTool } from '../../../src/tools/readonly/search_performance.js';
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

describe('search_performance', () => {
  it('hits /v1/search-performance', async () => {
    const scope = mockRevelor().get('/v1/search-performance').query(true).reply(200, {
      response_time_ms: { p50: 18, p95: 67, p99: 134 },
      cache_hit_rate: 0.34,
    });
    await searchPerformanceTool.handler({}, ctx());
    expect(scope.isDone()).toBe(true);
  });
});
