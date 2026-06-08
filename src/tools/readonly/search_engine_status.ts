import { z } from 'zod';
import { defineTool, runOrMock } from '../../tool_helpers.js';

const InputSchema = z.object({});
const OutputSchema = z.object({}).passthrough();

export const searchEngineStatusTool = defineTool({
  name: 'search_engine_status',
  description:
    'OpenSearch/search engine status: latency p50/p95/p99, indexed product count, cluster health. ' +
    'Use when user asks about search infrastructure performance or "is search slow?".',
  category: 'readonly',
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  handler: async (input, ctx) =>
    runOrMock('search_engine_status', input, ctx, async (_, c) =>
      c.cache.getOrSet('search_engine_status', async () => {
        const res = await c.client.get('/v1/health/search-engine');
        return res.data as Record<string, unknown>;
      }),
    ),
});
