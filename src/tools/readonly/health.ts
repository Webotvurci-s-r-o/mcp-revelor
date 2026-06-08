import { z } from 'zod';
import { defineTool, runOrMock } from '../../tool_helpers.js';

const InputSchema = z.object({});

const OutputSchema = z.object({
  status: z.string(),
  tenant_id: z.string().optional(),
  components: z.record(z.string()).optional(),
  timestamp: z.string().optional(),
});

export const healthTool = defineTool({
  name: 'health',
  description:
    'Returns overall Revelor system health: search engine status, sync status, backend status. ' +
    'Use when user asks "is everything running?" or as a quick sanity check at conversation start.',
  category: 'readonly',
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  handler: async (input, ctx) =>
    runOrMock('health', input, ctx, async (_, c) =>
      c.cache.getOrSet('health', async () => {
        const res = await c.client.get('/v1/health');
        return OutputSchema.parse(res.data);
      }),
    ),
});
