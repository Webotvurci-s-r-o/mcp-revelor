import { describe, it, expect, afterEach } from 'vitest';
import { searchEngineStatusTool } from '../../../src/tools/readonly/search_engine_status.js';
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

describe('search_engine_status', () => {
  it('hits /v1/health/search-engine', async () => {
    const scope = mockRevelor().get('/v1/health/search-engine').reply(200, {
      status: 'ok', products_indexed: 8432,
      latency_ms: { p50: 23, p95: 89, p99: 142 }, cluster_health: 'green',
    });
    await searchEngineStatusTool.handler({}, ctx());
    expect(scope.isDone()).toBe(true);
  });
});
