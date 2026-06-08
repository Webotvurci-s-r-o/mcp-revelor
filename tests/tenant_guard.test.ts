import { describe, it, expect, afterEach } from 'vitest';
import { verifyTenant } from '../src/tenant_guard.js';
import { mockRevelor, cleanup } from './helpers/mock_revelor.js';
import { createHttpClient } from '../src/http_client.js';

afterEach(cleanup);

const baseCfg = {
  baseUrl: 'https://test.revelor.cz',
  apiKey: 'rvlr_x',
  httpTimeoutMs: 1000,
};

describe('verifyTenant', () => {
  it('passes when tenant_id matches', async () => {
    mockRevelor().get('/v1/health').reply(200, { tenant_id: '123456', status: 'ok' });
    const client = createHttpClient(baseCfg);
    await expect(verifyTenant(client, '123456')).resolves.toBe(true);
  });

  it('throws on tenant mismatch', async () => {
    mockRevelor().get('/v1/health').reply(200, { tenant_id: '999999' });
    const client = createHttpClient(baseCfg);
    await expect(verifyTenant(client, '123456')).rejects.toThrow(/mismatch|tenant/i);
  });

  it('throws on 401', async () => {
    mockRevelor().get('/v1/health').reply(401, { error: { code: 'INVALID_TOKEN' } });
    const client = createHttpClient(baseCfg);
    await expect(verifyTenant(client, '123456')).rejects.toThrow();
  });

  it('throws when health response lacks tenant_id', async () => {
    mockRevelor().get('/v1/health').reply(200, { status: 'ok' });  // no tenant_id
    const client = createHttpClient(baseCfg);
    await expect(verifyTenant(client, '123456')).rejects.toThrow(/NO_TENANT_ID|tenant_id/);
  });
});
