import { z } from 'zod';
import { defineTool, runOrMock } from '../../tool_helpers.js';

const InputSchema = z.object({
  item_id: z.string().min(1),
  new_position: z.number().int().min(1).max(10),
  dry_run: z.boolean().default(false),
});
const OutputSchema = z.object({}).passthrough();

export const updateTopItemPositionTool = defineTool({
  name: 'update_top_item_position',
  description:
    'Change position of an already-pinned top item (1=top, 10=lowest). Does NOT unpin — only reorders. ' +
    'Pass dry_run=true to preview. To unpin, use dashboard (no MCP tool for that — safety).',
  category: 'mutation',
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  handler: async (input, ctx) =>
    runOrMock('update_top_item_position', input, ctx, async (i, c) => {
      if (i.dry_run) {
        return {
          _dry_run: true,
          would_update: { item_id: i.item_id, new_position: i.new_position },
        } as Record<string, unknown>;
      }
      const res = await c.client.put(`/top-items/${encodeURIComponent(i.item_id)}`, { position: i.new_position });
      return res.data as Record<string, unknown>;
    }),
});
