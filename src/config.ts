import { z } from 'zod';

const HTTPS_OR_LOCALHOST = /^(https:\/\/|http:\/\/localhost(:\d+)?(\/|$))/;

const baseSchema = z.object({
  REVELOR_API_KEY: z.string().regex(/^rvlr_/, 'must start with rvlr_').optional(),
  REVELOR_TENANT_ID: z.string().min(1).optional(),
  REVELOR_BASE_URL: z
    .string()
    .url()
    .refine((v) => HTTPS_OR_LOCALHOST.test(v), 'BASE_URL must be https:// (or http://localhost for dev)')
    .optional(),
  REVELOR_MCP_MODE: z.enum(['readonly', 'full', 'mock', 'auto']).default('auto'),
  REVELOR_ADMIN_TOKEN: z.string().min(10).optional(),
  REVELOR_HTTP_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  REVELOR_CACHE_TTL_MS: z.coerce.number().int().nonnegative().default(30_000),
});

export type Config = {
  mode: 'readonly' | 'full' | 'mock' | 'auto';
  apiKey?: string;
  adminToken?: string;
  tenantId?: string;
  baseUrl?: string;
  httpTimeoutMs: number;
  cacheTtlMs: number;
};

export function loadConfig(env: NodeJS.ProcessEnv | Record<string, string | undefined>): Config {
  const parsed = baseSchema.parse(env);

  if (parsed.REVELOR_MCP_MODE === 'mock') {
    return {
      mode: 'mock',
      httpTimeoutMs: parsed.REVELOR_HTTP_TIMEOUT_MS,
      cacheTtlMs: parsed.REVELOR_CACHE_TTL_MS,
    };
  }

  // Pro auto/readonly/full mod jsou povinne pouze API_KEY a BASE_URL.
  // TENANT_ID a MODE se daji derivovat z /v1/health (provede discoverConfig
  // pri startupu v index.ts).
  if (!parsed.REVELOR_API_KEY) throw new Error('REVELOR_API_KEY is required (rvlr_ token from Revelor dashboard)');
  if (!parsed.REVELOR_BASE_URL) throw new Error('REVELOR_BASE_URL is required (e.g. https://yourtenant.revelor.cz)');

  const cfg: Config = {
    mode: parsed.REVELOR_MCP_MODE,
    apiKey: parsed.REVELOR_API_KEY,
    baseUrl: parsed.REVELOR_BASE_URL,
    httpTimeoutMs: parsed.REVELOR_HTTP_TIMEOUT_MS,
    cacheTtlMs: parsed.REVELOR_CACHE_TTL_MS,
  };
  if (parsed.REVELOR_TENANT_ID !== undefined) {
    cfg.tenantId = parsed.REVELOR_TENANT_ID;
  }
  if (parsed.REVELOR_ADMIN_TOKEN !== undefined) {
    cfg.adminToken = parsed.REVELOR_ADMIN_TOKEN;
  }
  return cfg;
}
