import { z } from 'zod';
import { defineTool, runOrMock } from '../../tool_helpers.js';

const InputSchema = z
  .object({
    click_weight: z.number().min(0.1).max(10).optional(),
    availability_weight: z.number().min(0.1).max(10).optional(),
    margin_weight: z.number().min(0.1).max(10).optional(),
    dry_run: z.boolean().default(false),
  })
  .refine(
    (v) => v.click_weight !== undefined || v.availability_weight !== undefined || v.margin_weight !== undefined,
    { message: 'At least one weight must be specified' },
  );
const OutputSchema = z.object({}).passthrough();

export const updateCtrWeightsTool = defineTool({
  name: 'update_ctr_weights',
  description:
    'Update ranking weights (each 0.1–10.0): click_weight (how much CTR influences ranking), ' +
    'availability_weight (in-stock bonus), margin_weight (margin influence). At least one must be specified. ' +
    'Default values are 1.0. Use when user wants to tune ranking behavior. Pass dry_run=true to preview.',
  category: 'mutation',
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  handler: async (input, ctx) =>
    runOrMock('update_ctr_weights', input, ctx, async (i, c) => {
      const payload = Object.fromEntries(
        Object.entries(i).filter(([k, v]) => k !== 'dry_run' && v !== undefined),
      );
      if (i.dry_run) {
        return { _dry_run: true, would_update: payload } as Record<string, unknown>;
      }
      const res = await c.client.post('/api/admin/ctr-settings', payload);
      return res.data as Record<string, unknown>;
    }),
});
