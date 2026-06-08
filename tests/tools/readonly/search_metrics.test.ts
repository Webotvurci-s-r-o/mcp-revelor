import { describe, it, expect, afterEach } from 'vitest';
import { searchMetricsTool } from '../../../src/tools/readonly/search_metrics.js';
import { mockRevelor, cleanup } from '../../helpers/mock_revelor.js';
import { createHttpClient } from '../../../src/http_client.js';
import { TtlCache } from '../../../src/cache.js';

afterEach(cleanup);
const ctx = () => ({
  client: createHttpClient({ baseUrl: 'https://test.revelor.cz', apiKey: 'rvlr_x', httpTimeoutMs: 1000 }),
  mode: 'readonly' as const,
  cache: new TtlCache(0),
  tenantId: '123456',
});

describe('search_metrics tool', () => {
  it('uses last 7 days as default range', async () => {
    const scope = mockRevelor()
      .get('/v1/metrics')
      .query((q) => {
        const from = new Date(String(q.from));
        const to = new Date(String(q.to));
        const days = (to.getTime() - from.getTime()) / 86_400_000;
        return Math.round(days) === 7;
      })
      .reply(200, { summary: { searches_total: 0 } });
    await searchMetricsTool.handler({}, ctx());
    expect(scope.isDone()).toBe(true);
  });

  it('passes explicit date range', async () => {
    const scope = mockRevelor()
      .get('/v1/metrics')
      .query({ from: '2026-04-01', to: '2026-04-30' })
      .reply(200, { summary: {} });
    await searchMetricsTool.handler({ from: '2026-04-01', to: '2026-04-30' }, ctx());
    expect(scope.isDone()).toBe(true);
  });

  it('rejects range > 90 days', async () => {
    await expect(
      searchMetricsTool.handler({ from: '2026-01-01', to: '2026-12-31' }, ctx()),
    ).rejects.toThrow(/90 days/);
  });
});
