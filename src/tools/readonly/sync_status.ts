import { z } from 'zod';
import { defineTool, runOrMock } from '../../tool_helpers.js';

const InputSchema = z.object({});
const OutputSchema = z.object({}).passthrough();

export const syncStatusTool = defineTool({
  name: 'sync_status',
  description:
    'Feed sync status: running/stopped, last_full_sync timestamp, last_delta_sync, recent errors. ' +
    'Use when user asks "is sync running?" or "when was last sync?" or to diagnose stale data issues.',
  category: 'readonly',
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  handler: async (input, ctx) =>
    runOrMock('sync_status', input, ctx, async (_, c) => {
      const res = await c.client.get('/v1/health/sync');
      return res.data as Record<string, unknown>;
    }),
});
