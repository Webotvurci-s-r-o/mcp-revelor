import { z } from 'zod';
import { defineTool, runOrMock } from '../../tool_helpers.js';

const InputSchema = z.object({
  product_id: z.string().min(1),
  hidden: z.boolean(),
  dry_run: z.boolean().default(false),
});
const OutputSchema = z.object({}).passthrough();

export const setProductHiddenTool = defineTool({
  name: 'set_product_hidden',
  description:
    'Toggle hidden_manual flag for a product — hides/shows in search results. ' +
    'Reversible: call with hidden=false to unhide. ' +
    'Use when user wants to temporarily remove a product from search without deleting it from the feed. ' +
    'Pass dry_run=true to preview.',
  category: 'mutation',
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  handler: async (input, ctx) =>
    runOrMock('set_product_hidden', input, ctx, async (i, c) => {
      if (i.dry_run) {
        return {
          _dry_run: true,
          would_set: { product_id: i.product_id, hidden: i.hidden },
        } as Record<string, unknown>;
      }
      const res = await c.client.post('/api/admin/feed-item/hidden', {
        index: 'products',
        id: i.product_id,
        hidden: i.hidden,
      });
      return res.data as Record<string, unknown>;
    }),
});
