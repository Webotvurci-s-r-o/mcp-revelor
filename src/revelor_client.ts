import type { AxiosInstance } from 'axios';
import { createHttpClient } from './http_client.js';
import { TtlCache } from './cache.js';
import type { Config } from './config.js';

export type RevelorClient = {
  http: AxiosInstance;
  cache: TtlCache<unknown>;
};

export function createRevelorClient(cfg: Config): RevelorClient {
  if (cfg.mode === 'mock') {
    return {
      http: createHttpClient({ baseUrl: 'http://unused', httpTimeoutMs: 1 }),
      cache: new TtlCache(0),
    };
  }
  const httpCfg: Parameters<typeof createHttpClient>[0] = {
    baseUrl: cfg.baseUrl ?? '',
    httpTimeoutMs: cfg.httpTimeoutMs,
    ...(cfg.apiKey !== undefined ? { apiKey: cfg.apiKey } : {}),
    ...(cfg.adminToken !== undefined ? { adminToken: cfg.adminToken } : {}),
    ...(cfg.tenantId !== undefined ? { tenantId: cfg.tenantId } : {}),
  };
  const http = createHttpClient(httpCfg);
  const cache = new TtlCache<unknown>(cfg.cacheTtlMs);
  return { http, cache };
}
