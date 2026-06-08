import { describe, it, expect, afterEach } from 'vitest';
import { partnerRecommendationsAnalyticsTool } from '../../../src/tools/readonly/partner_recommendations_analytics.js';
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

describe('partner_recommendations_analytics', () => {
  it('hits /v1/partner/recommendations/analytics', async () => {
    const scope = mockRevelor()
      .get('/v1/partner/recommendations/analytics')
      .query(true)
      .reply(200, { impressions: 18234, ctr: 0.0721 });
    await partnerRecommendationsAnalyticsTool.handler({}, ctx());
    expect(scope.isDone()).toBe(true);
  });
});
