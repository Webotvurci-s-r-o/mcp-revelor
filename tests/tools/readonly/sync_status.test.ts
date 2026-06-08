import { describe, it, expect, afterEach } from 'vitest';
import { syncStatusTool } from '../../../src/tools/readonly/sync_status.js';
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

describe('sync_status', () => {
  it('hits /v1/health/sync', async () => {
    const scope = mockRevelor().get('/v1/health/sync').reply(200, {
      running: false, last_full_sync: '2026-05-14T03:00:00Z',
      last_delta_sync: '2026-05-14T09:45:00Z', recent_errors: [],
    });
    await syncStatusTool.handler({}, ctx());
    expect(scope.isDone()).toBe(true);
  });
});
