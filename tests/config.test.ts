import { describe, it, expect } from 'vitest';
import { loadConfig } from '../src/config.js';

const goodEnv = {
  REVELOR_API_KEY: 'rvlr_test_token_123',
  REVELOR_TENANT_ID: '123456',
  REVELOR_BASE_URL: 'https://yourtenant.revelor.cz',
  REVELOR_MCP_MODE: 'readonly',
};

describe('loadConfig', () => {
  it('loads valid readonly config', () => {
    const cfg = loadConfig(goodEnv);
    expect(cfg.mode).toBe('readonly');
    expect(cfg.tenantId).toBe('123456');
  });

  it('rejects http BASE_URL (S1)', () => {
    expect(() =>
      loadConfig({ ...goodEnv, REVELOR_BASE_URL: 'http://example.com' }),
    ).toThrow(/https/i);
  });

  it('allows http://localhost for dev', () => {
    expect(() =>
      loadConfig({ ...goodEnv, REVELOR_BASE_URL: 'http://localhost:8000' }),
    ).not.toThrow();
  });

  it('full mode works with just rvlr_ token (no separate ADMIN_TOKEN needed)', () => {
    // Po PR #407+#447 v BE: rvlr_ token s write:* scopes plne pokryje full mode.
    const cfg = loadConfig({ ...goodEnv, REVELOR_MCP_MODE: 'full' });
    expect(cfg.mode).toBe('full');
    expect(cfg.apiKey).toBe('rvlr_test_token_123');
  });

  it('mock mode bypasses token requirements', () => {
    const cfg = loadConfig({ REVELOR_MCP_MODE: 'mock' });
    expect(cfg.mode).toBe('mock');
  });

  it('admin token still accepted (back-compat)', () => {
    const cfg = loadConfig({
      ...goodEnv,
      REVELOR_MCP_MODE: 'full',
      REVELOR_ADMIN_TOKEN: 'jwt.token.here',
    });
    expect(cfg.mode).toBe('full');
    expect(cfg.adminToken).toBe('jwt.token.here');
  });

  it('TENANT_ID is optional (auto-discovered v index.ts pres /v1/health)', () => {
    const { REVELOR_TENANT_ID, ...envWithoutTenant } = goodEnv;
    void REVELOR_TENANT_ID;
    const cfg = loadConfig(envWithoutTenant);
    expect(cfg.tenantId).toBeUndefined();
    expect(cfg.apiKey).toBe('rvlr_test_token_123');
  });

  it('default mode is "auto" when not specified', () => {
    const { REVELOR_MCP_MODE, ...envWithoutMode } = goodEnv;
    void REVELOR_MCP_MODE;
    const cfg = loadConfig(envWithoutMode);
    expect(cfg.mode).toBe('auto');
  });
});
