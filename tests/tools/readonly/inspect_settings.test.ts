import { describe, it, expect, afterEach } from 'vitest';
import { inspectSettingsTool } from '../../../src/tools/readonly/inspect_settings.js';
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

describe('inspect_settings', () => {
  it('hits /api/admin/settings', async () => {
    const scope = mockRevelor()
      .get('/api/admin/settings')
      .matchHeader('authorization', 'Bearer jwt.admin')
      .reply(200, { sync_source: 'api', hide_revenue: false });
    await inspectSettingsTool.handler({}, ctx());
    expect(scope.isDone()).toBe(true);
  });
});
