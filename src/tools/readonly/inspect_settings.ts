import { z } from 'zod';
import { defineTool, runOrMock } from '../../tool_helpers.js';

const InputSchema = z.object({});
const OutputSchema = z.object({}).passthrough();

export const inspectSettingsTool = defineTool({
  name: 'inspect_settings',
  description:
    'Returns current dashboard config (read-only inspection). Use when user asks "what are my settings?" or before making any settings change. Requires admin token.',
  category: 'readonly',
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  handler: async (input, ctx) =>
    runOrMock('inspect_settings', input, ctx, async (_, c) =>
      c.cache.getOrSet('inspect_settings', async () => {
        const res = await c.client.get('/api/admin/settings');
        return res.data as Record<string, unknown>;
      }),
    ),
});
