import { z } from 'zod';
import { defineTool, runOrMock } from '../../tool_helpers.js';

const DateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD');

const InputSchema = z
  .object({
    from: DateStr.optional(),
    to: DateStr.optional(),
    granularity: z.enum(['hour', 'day', 'week', 'month']).optional(),
  })
  .superRefine((val, c) => {
    if (val.from && val.to) {
      const days = (new Date(val.to).getTime() - new Date(val.from).getTime()) / 86_400_000;
      if (days > 90) c.addIssue({ code: 'custom', message: 'Date range cannot exceed 90 days' });
      if (days < 0) c.addIssue({ code: 'custom', message: 'from must be before to' });
    }
  });

const OutputSchema = z.object({
  summary: z.record(z.unknown()),
  timeseries: z.array(z.record(z.unknown())).optional(),
  top_queries: z.array(z.record(z.unknown())).optional(),
  zero_result_queries: z.array(z.record(z.unknown())).optional(),
  top_clicked_products: z.array(z.record(z.unknown())).optional(),
});

function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getTime() - 7 * 86_400_000);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export const searchMetricsTool = defineTool({
  name: 'search_metrics',
  description:
    'Aggregated search KPIs (total searches, zero-result rate, CTR, conversion rate) for a date range. ' +
    'Default range: last 7 days. Max range: 90 days. ' +
    'Use when user asks about search performance, trends, or wants to compare periods. ' +
    'NOT for individual queries — use search_logs for that.',
  category: 'readonly',
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  handler: async (input, ctx) => {
    const i = InputSchema.parse(input);
    return runOrMock('search_metrics', i, ctx, async (i, c) => {
      const r = { from: i.from ?? defaultRange().from, to: i.to ?? defaultRange().to };
      const params: Record<string, unknown> = { ...r };
      if (i.granularity) params.granularity = i.granularity;
      const res = await c.client.get('/v1/metrics', { params });
      return OutputSchema.parse(res.data);
    });
  },
});
