import { describe, it, expect, afterEach } from 'vitest';
import { healthTool } from '../../../src/tools/readonly/health.js';
import { mockRevelor, cleanup } from '../../helpers/mock_revelor.js';
import { createHttpClient } from '../../../src/http_client.js';
import { TtlCache } from '../../../src/cache.js';

afterEach(cleanup);
const ctx = (mode: 'readonly' | 'mock' = 'readonly') => ({
  client: createHttpClient({ baseUrl: 'https://test.revelor.cz', apiKey: 'rvlr_x', httpTimeoutMs: 1000 }),
  mode,
  cache: new TtlCache(0),
  tenantId: '123456',
});

describe('health tool', () => {
  it('calls /v1/health and returns body', async () => {
    mockRevelor().get('/v1/health').reply(200, { status: 'ok', tenant_id: '1' });
    const res = await healthTool.handler({}, ctx());
    expect(res.status).toBe('ok');
  });
  it('returns fixture in mock mode', async () => {
    const res = await healthTool.handler({}, ctx('mock'));
    expect(res.status).toBe('ok');
    expect(res.tenant_id).toBe('demo_tenant_001');
  });
  it('category is readonly', () => {
    expect(healthTool.category).toBe('readonly');
  });
});
