import { describe, it, expect, afterEach } from 'vitest';
import { recommendationMetricsTool } from '../../../src/tools/readonly/recommendation_metrics.js';
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

describe('recommendation_metrics', () => {
  it('hits /v1/recommendations/metrics', async () => {
    const scope = mockRevelor().get('/v1/recommendations/metrics').query(true).reply(200, {
      impressions: 18234, ctr: 0.0721, conversion_rate: 0.0182,
      top_clicked: [{ product_id: 'p-12', clicks: 234 }],
    });
    await recommendationMetricsTool.handler({}, ctx());
    expect(scope.isDone()).toBe(true);
  });
});
