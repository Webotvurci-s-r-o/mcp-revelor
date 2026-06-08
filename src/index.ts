// Shebang is injected by tsup `banner` config for the built dist/ file.
// Source itself must NOT have a shebang — node's ESM parser fails when the
// same line appears twice in the compiled output (tsup-banner + source).
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema as zodToJsonSchemaImpl } from 'zod-to-json-schema';
import { loadConfig } from './config.js';
import { createRevelorClient } from './revelor_client.js';
import { discoverConfig, verifyTenant, deriveModeFromScopes } from './tenant_guard.js';
import { getActiveTools } from './tools/registry.js';
import { logger } from './logger.js';
import { RevelorMcpError } from './errors.js';

import './tools/readonly/_all.js';
import './tools/mutations/_all.js';

async function main(): Promise<void> {
  const cfg = loadConfig(process.env);
  logger.info({ mode: cfg.mode, tenantId: cfg.tenantId }, 'Starting revelor-mcp');

  // Auto-discovery: pokud TENANT_ID nebo MODE neni explicitne nastaven,
  // odvodime z /v1/health odpovedi (vraci tenant_id + token.scopes).
  // Pro discovery potrebujeme prozatimni klient bez tenant_id headeru —
  // BE pak vezme tenant_id z tokenu samotneho.
  let resolvedTenantId: string | undefined = cfg.tenantId;
  let resolvedMode: 'readonly' | 'full' | 'mock' = cfg.mode === 'auto' ? 'readonly' : cfg.mode;

  if (cfg.mode !== 'mock') {
    const needDiscovery = !cfg.tenantId || cfg.mode === 'auto';
    if (needDiscovery) {
      // Destructure to omit tenantId entirely (exactOptionalPropertyTypes safe).
      const { tenantId: _omit, ...cfgWithoutTenant } = cfg;
      void _omit;
      const discoveryClient = createRevelorClient(cfgWithoutTenant);
      try {
        const discovered = await discoverConfig(discoveryClient.http);
        if (!resolvedTenantId) {
          resolvedTenantId = discovered.tenantId;
          logger.info({ tenantId: resolvedTenantId }, 'Auto-discovered tenant_id from token');
        }
        if (cfg.mode === 'auto') {
          resolvedMode = deriveModeFromScopes(discovered.scopes);
          logger.info({ mode: resolvedMode, scopes: discovered.scopes }, 'Auto-derived mode from scopes');
        }
      } catch (e) {
        logger.error({ err: (e as Error).message }, 'Auto-discovery failed (set REVELOR_TENANT_ID + REVELOR_MCP_MODE explicitne)');
        process.exit(1);
      }
    }
  }

  // Po discovery — finalni typed config s narrowed mode + resolved tenantId.
  const finalCfg: typeof cfg & { mode: typeof resolvedMode } = {
    ...cfg,
    mode: resolvedMode,
    ...(resolvedTenantId !== undefined ? { tenantId: resolvedTenantId } : {}),
  };
  const revelorClient = createRevelorClient(finalCfg);
  const ctx = {
    client: revelorClient.http,
    mode: resolvedMode,
    cache: revelorClient.cache,
    tenantId: resolvedTenantId ?? '',
  };

  if (resolvedMode !== 'mock') {
    try {
      await verifyTenant(revelorClient.http, resolvedTenantId ?? '');
      logger.info('Tenant verification OK');
    } catch (e) {
      logger.error({ err: (e as Error).message }, 'Tenant verification failed');
      process.exit(1);
    }
  }

  const tools = getActiveTools(resolvedMode);
  logger.info({ count: tools.length }, 'Tools registered');

  const server = new Server(
    { name: 'revelor-mcp', version: '0.1.0' },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      inputSchema: zodToJsonSchemaImpl(t.inputSchema, { target: 'jsonSchema7', $refStrategy: 'none' }),
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const tool = tools.find((t) => t.name === req.params.name);
    if (!tool) {
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Tool ${req.params.name} not active in mode ${resolvedMode}`,
      );
    }
    const parsed = tool.inputSchema.safeParse(req.params.arguments ?? {});
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; ');
      return {
        content: [{ type: 'text', text: `Invalid input for tool ${tool.name}: ${issues}` }],
        isError: true,
      };
    }
    try {
      const output = await tool.handler(parsed.data, ctx);
      return { content: [{ type: 'text', text: JSON.stringify(output, null, 2) }] };
    } catch (e) {
      if (e instanceof RevelorMcpError) {
        return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
      }
      throw e;
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('MCP server ready on stdio');
}

main().catch((e: unknown) => {
  logger.error({ err: e instanceof Error ? e.message : String(e) }, 'Fatal startup error');
  process.exit(1);
});
