import { z } from 'zod';
import { defineTool, runOrMock } from '../../tool_helpers.js';

const InputSchema = z
  .object({
    limit: z.number().int().min(1).max(500).default(50),
    offset: z.number().int().min(0).default(0),
    zero_results_only: z.boolean().default(false),
    from: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD')
      .optional(),
    to: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD')
      .optional(),
  })
  .superRefine((val, c) => {
    if (val.from && val.to) {
      const days = (new Date(val.to).getTime() - new Date(val.from).getTime()) / 86_400_000;
      if (days > 90) c.addIssue({ code: 'custom', message: 'Date range cannot exceed 90 days' });
      if (days < 0) c.addIssue({ code: 'custom', message: 'from must be before to' });
    }
  });

const OutputSchema = z.object({}).passthrough();

export const searchLogsTool = defineTool({
  name: 'search_logs',
  description:
    'Anonymized search log entries (query, timestamp, hits, response_time, cached). ' +
    'Default limit 50, max 500 (LLM context protection). ' +
    'Use zero_results_only=true to focus on failing queries. ' +
    'Use when user asks "show me recent searches" or "what queries failed yesterday?".',
  category: 'readonly',
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  handler: async (input, ctx) =>
    runOrMock('search_logs', input, ctx, async (i, c) => {
      const params: Record<string, unknown> = { limit: i.limit, offset: i.offset };
      if (i.zero_results_only) params.zero_results_only = 'true';
      if (i.from) params.from = i.from;
      if (i.to) params.to = i.to;
      const res = await c.client.get('/v1/search-logs', { params });
      return res.data as Record<string, unknown>;
    }),
});
