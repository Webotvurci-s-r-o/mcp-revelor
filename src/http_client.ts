import axios, { AxiosInstance, AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import https from 'node:https';
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { mapHttpError } from './errors.js';
import { logger } from './logger.js';

const VERSION = '0.1.0';

export type HttpClientConfig = {
  baseUrl: string;
  apiKey?: string;
  adminToken?: string;
  tenantId?: string;
  httpTimeoutMs: number;
  retryBaseMs?: number;
};

export function createHttpClient(cfg: HttpClientConfig): AxiosInstance {
  const instance = axios.create({
    baseURL: cfg.baseUrl,
    timeout: cfg.httpTimeoutMs,
    httpsAgent: new https.Agent({ keepAlive: true }),
    httpAgent: new http.Agent({ keepAlive: true }),
    headers: { 'User-Agent': `revelor-mcp/${VERSION} (npx)` },
  });

  // Attach axios-retry BEFORE our error interceptor so it runs first on errors.
  // Default validateStatus (reject >= 400) means 5xx errors flow through axiosRetry.
  axiosRetry(instance, {
    retries: 3,
    retryDelay: (attempt) => (cfg.retryBaseMs ?? 1000) * 2 ** (attempt - 1),
    retryCondition: (error) => {
      const method = error.config?.method?.toLowerCase() ?? '';
      const status = error.response?.status ?? 0;
      const isGet = method === 'get';
      const is5xx = status >= 500;
      const isNetErr = axiosRetry.isNetworkError(error);
      return isGet && (isNetErr || is5xx);
    },
  });

  // Single request interceptor: attach X-Request-Id, X-Tenant, and the right Authorization.
  // Admin endpoints get adminToken when configured; everything else gets apiKey.
  // Combined into one interceptor to avoid Axios's LIFO ordering footgun.
  instance.interceptors.request.use((req) => {
    const requestId = `rvm-${randomUUID()}`;
    req.headers['X-Request-Id'] = requestId;
    if (cfg.tenantId) req.headers['X-Tenant'] = cfg.tenantId;

    const isAdminPath =
      req.url?.startsWith('/api/admin/') ||
      req.url?.startsWith('/top-items') ||
      req.url?.startsWith('/api/synonyms');

    if (isAdminPath && cfg.adminToken) {
      req.headers.Authorization = `Bearer ${cfg.adminToken}`;
    } else if (cfg.apiKey) {
      req.headers.Authorization = `Bearer ${cfg.apiKey}`;
    }

    (req as unknown as { __requestId: string }).__requestId = requestId;
    return req;
  });

  // Response interceptor: map HTTP errors to RevelorMcpError.
  // Runs after axiosRetry has finished (retried or given up).
  instance.interceptors.response.use(
    (res) => res,
    (error: unknown) => {
      const axiosErr = error as AxiosError;
      const status = axiosErr.response?.status ?? 0;
      const data = axiosErr.response?.data ?? {};
      const requestId =
        (axiosErr.config as unknown as { __requestId?: string } | undefined)?.__requestId ??
        'unknown';

      logger.error(
        { url: axiosErr.config?.url, status, requestId },
        'HTTP error',
      );

      throw mapHttpError(status, data, requestId);
    },
  );

  return instance;
}
