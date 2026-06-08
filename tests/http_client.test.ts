import { describe, it, expect, afterEach } from 'vitest';
import { createHttpClient } from '../src/http_client.js';
import { mockRevelor, cleanup } from './helpers/mock_revelor.js';

afterEach(cleanup);

const config = {
  baseUrl: 'https://test.revelor.cz',
  apiKey: 'rvlr_xxx',
  httpTimeoutMs: 1000,
};

describe('http_client', () => {
  it('sends Bearer header + User-Agent + X-Request-Id', async () => {
    const scope = mockRevelor()
      .get('/v1/health')
      .matchHeader('authorization', 'Bearer rvlr_xxx')
      .matchHeader('user-agent', /revelor-mcp\//)
      .matchHeader('x-request-id', /^rvm-/)
      .reply(200, { ok: true });

    const client = createHttpClient(config);
    const res = await client.get('/v1/health');
    expect(res.data).toEqual({ ok: true });
    expect(scope.isDone()).toBe(true);
  });

  it('throws RevelorMcpError on 4xx', async () => {
    mockRevelor().get('/v1/health').reply(401, { error: { code: 'INVALID_TOKEN' } });
    const client = createHttpClient(config);
    await expect(client.get('/v1/health')).rejects.toThrow(/token/i);
  });

  it('retries idempotent GET on 5xx (max 3)', async () => {
    mockRevelor()
      .get('/v1/health').reply(503, {})
      .get('/v1/health').reply(503, {})
      .get('/v1/health').reply(200, { ok: true });
    const client = createHttpClient({ ...config, retryBaseMs: 1 });
    const res = await client.get('/v1/health');
    expect(res.data).toEqual({ ok: true });
  });

  it('does NOT retry POST (S4)', async () => {
    mockRevelor().post('/api/admin/feeds/load').reply(503, {});
    const client = createHttpClient(config);
    await expect(client.post('/api/admin/feeds/load', {})).rejects.toThrow();
  });

  it('uses adminToken for /api/admin/* endpoints (not apiKey)', async () => {
    const scope = mockRevelor()
      .get('/api/admin/debug/query')
      .matchHeader('authorization', 'Bearer jwt.admin.xyz')
      .reply(200, { ok: true });
    const client = createHttpClient({ ...config, adminToken: 'jwt.admin.xyz' });
    await client.get('/api/admin/debug/query');
    expect(scope.isDone()).toBe(true);
  });

  it('uses adminToken for /top-items endpoints', async () => {
    const scope = mockRevelor()
      .post('/top-items', () => true)
      .matchHeader('authorization', 'Bearer jwt.admin.xyz')
      .reply(201, { id: 'x' });
    const client = createHttpClient({ ...config, adminToken: 'jwt.admin.xyz' });
    await client.post('/top-items', { entity_type: 'products', entity_id: 'x', position: 1 });
    expect(scope.isDone()).toBe(true);
  });

  it('falls back to apiKey when adminToken missing on admin endpoints', async () => {
    const scope = mockRevelor()
      .get('/api/admin/debug/query')
      .matchHeader('authorization', 'Bearer rvlr_xxx')
      .reply(200, { ok: true });
    const client = createHttpClient(config);
    await client.get('/api/admin/debug/query');
    expect(scope.isDone()).toBe(true);
  });
});
