import { z } from 'zod';
import { defineTool, runOrMock } from '../../tool_helpers.js';

const InputSchema = z.object({
  entity_type: z.enum(['products', 'categories', 'articles', 'brands']),
  entity_id: z.string().min(1),
  position: z.number().int().min(1).max(10),
  dry_run: z.boolean().default(false),
});
const OutputSchema = z.object({}).passthrough();

export const pinTopItemTool = defineTool({
  name: 'pin_top_item',
  description:
    'Pins a product/category/article/brand to a featured position (1=top, 10=lowest). ' +
    'Use when user asks to "highlight", "feature", or "pin" an item. ' +
    'Pass dry_run=true to preview the change without applying it. ' +
    'To unpin or change order, use update_top_item_position (or unpin via dashboard).',
  category: 'mutation',
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  handler: async (input, ctx) =>
    runOrMock('pin_top_item', input, ctx, async (i, c) => {
      if (i.dry_run) {
        return {
          _dry_run: true,
          would_pin: { entity_type: i.entity_type, entity_id: i.entity_id, position: i.position },
          _hint: 'Call again with dry_run=false to apply.',
        } as Record<string, unknown>;
      }
      const res = await c.client.post('/top-items', {
        entity_type: i.entity_type,
        entity_id: i.entity_id,
        position: i.position,
      });
      return res.data as Record<string, unknown>;
    }),
});
