import { z } from 'zod';
import { defineTool, runOrMock } from '../../tool_helpers.js';

const InputSchema = z.object({
  product_id: z.string().min(1),
  manual_boost: z.number().min(0.1).max(10),
  dry_run: z.boolean().default(false),
});
const OutputSchema = z.object({}).passthrough();

export const setProductScoreTool = defineTool({
  name: 'set_product_score',
  description:
    'Apply manual boost coefficient (0.1–10.0) to a product. Combined with CTR, clicks, views, conversion for final ranking. ' +
    'Default boost=1.0 means no change. >1.0 promotes; <1.0 demotes. Pass dry_run=true to preview.',
  category: 'mutation',
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  handler: async (input, ctx) =>
    runOrMock('set_product_score', input, ctx, async (i, c) => {
      if (i.dry_run) {
        return {
          _dry_run: true,
          would_set: { product_id: i.product_id, manual_boost: i.manual_boost },
        } as Record<string, unknown>;
      }
      const res = await c.client.post('/api/admin/feed-item/score', {
        index: 'products',
        id: i.product_id,
        manual_boost: i.manual_boost,
      });
      return res.data as Record<string, unknown>;
    }),
});
