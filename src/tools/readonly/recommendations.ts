import { z } from 'zod';
import { defineTool, runOrMock } from '../../tool_helpers.js';

const InputSchema = z.object({
  placement: z.enum(['product_detail', 'cart', 'homepage', 'frequently_bought_together']),
  product_id: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(10),
});

const OutputSchema = z.object({}).passthrough();

export const recommendationsTool = defineTool({
  name: 'recommendations',
  description:
    'Get product recommendations for a specific placement. product_detail and frequently_bought_together ' +
    'require product_id. homepage and cart do not. ' +
    'Use when user asks "what would you recommend on page X?" or wants to preview recommendations for a specific product.',
  category: 'readonly',
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  handler: async (input, ctx) =>
    runOrMock('recommendations', input, ctx, async (i, c) => {
      const params: Record<string, unknown> = { placement: i.placement, limit: i.limit };
      if (i.product_id) params.product_id = i.product_id;
      const res = await c.client.get('/v1/recommendations', { params });
      return res.data as Record<string, unknown>;
    }),
});
