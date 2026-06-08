import { z } from 'zod';
import { defineTool, runOrMock } from '../../tool_helpers.js';

function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getTime() - 7 * 86_400_000);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

const DateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD');

const InputSchema = z.object({
  from: DateStr.optional(),
  to: DateStr.optional(),
  placement: z
    .enum(['product_detail', 'cart', 'homepage', 'frequently_bought_together'])
    .optional(),
});

const OutputSchema = z.object({}).passthrough();

export const partnerRecommendationsAnalyticsTool = defineTool({
  name: 'partner_recommendations_analytics',
  description:
    'Full recommendation analytics (partner tier): impressions, CTR, conversions, revenue, ' +
    'breakdown by placement and strategy, top products, period comparison. ' +
    'Requires `read:partner` scope. ' +
    'Use when user wants DEEP rec analysis with revenue attribution.',
  category: 'readonly',
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  handler: async (input, ctx) =>
    runOrMock('partner_recommendations_analytics', input, ctx, async (i, c) => {
      const r = { from: i.from ?? defaultRange().from, to: i.to ?? defaultRange().to };
      const params: Record<string, unknown> = { ...r };
      if (i.placement) params.placement = i.placement;
      const res = await c.client.get('/v1/partner/recommendations/analytics', { params });
      return res.data as Record<string, unknown>;
    }),
});
