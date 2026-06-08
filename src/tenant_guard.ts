import type { AxiosInstance } from 'axios';

export type DiscoveredConfig = {
  tenantId: string;
  scopes: string[];
};

/**
 * Discover tenant_id + scopes z /v1/health response.
 * BE vraci `{tenant_id, token: {scopes}}` pro libovolny platny rvlr_ token.
 */
export async function discoverConfig(client: AxiosInstance): Promise<DiscoveredConfig> {
  const res = await client.get('/v1/health');
  const data = res.data as { tenant_id?: string | number; token?: { scopes?: string[] } };
  if (data.tenant_id === undefined || data.tenant_id === null) {
    throw new Error(
      'DISCOVER_NO_TENANT_ID: /v1/health response did not include tenant_id. ' +
        'Upgrade Revelor backend or set REVELOR_TENANT_ID explicitly.',
    );
  }
  return {
    tenantId: String(data.tenant_id),
    scopes: data.token?.scopes ?? [],
  };
}

/**
 * Verify ze /v1/health response.tenant_id matchuje expectedTenantId.
 * Pouziva se kdyz uzivatel REVELOR_TENANT_ID explicitne nastavil — chrani
 * pred situaci kdy token patri jinemu tenantu nez klient mysli.
 */
export async function verifyTenant(client: AxiosInstance, expectedTenantId: string): Promise<true> {
  const discovered = await discoverConfig(client);
  if (discovered.tenantId !== String(expectedTenantId)) {
    throw new Error(
      `TENANT_MISMATCH: expected ${expectedTenantId}, token belongs to ${discovered.tenantId}. ` +
        'Check REVELOR_TENANT_ID env var (nebo ho nech prazdny — derivuje se automaticky).',
    );
  }
  return true;
}

/**
 * Derivuje 'full' nebo 'readonly' mod ze scopes:
 * - obsahuje aspon jeden `write:*` → 'full'
 * - jen `read:*` → 'readonly'
 */
export function deriveModeFromScopes(scopes: string[]): 'readonly' | 'full' {
  const hasWrite = scopes.some((s) => s.startsWith('write:'));
  return hasWrite ? 'full' : 'readonly';
}
