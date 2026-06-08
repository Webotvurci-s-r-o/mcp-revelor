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
});

const OutputSchema = z.object({}).passthrough();

export const searchPerformanceTool = defineTool({
  name: 'search_performance',
  description:
    'Search response time percentiles (p50/p95/p99), cache hit rate, autocomplete usage rate, ' +
    'queries-with-filters rate. Use when user asks about search SPEED (not relevance). ' +
    'Default: last 7 days.',
  category: 'readonly',
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  handler: async (input, ctx) =>
    runOrMock('search_performance', input, ctx, async (i, c) => {
      const r = { from: i.from ?? defaultRange().from, to: i.to ?? defaultRange().to };
      const res = await c.client.get('/v1/search-performance', { params: r });
      return res.data as Record<string, unknown>;
    }),
});
