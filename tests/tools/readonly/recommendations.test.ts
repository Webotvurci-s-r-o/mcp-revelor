import { describe, it, expect, afterEach } from 'vitest';
import { recommendationsTool } from '../../../src/tools/readonly/recommendations.js';
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

describe('recommendations', () => {
  it('hits /v1/recommendations', async () => {
    const scope = mockRevelor()
      .get('/v1/recommendations')
      .query({ placement: 'homepage', limit: 10 })
      .reply(200, { items: [] });
    await recommendationsTool.handler({ placement: 'homepage', limit: 10 }, ctx());
    expect(scope.isDone()).toBe(true);
  });
});
