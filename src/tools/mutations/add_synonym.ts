import { z } from 'zod';
import { defineTool, runOrMock } from '../../tool_helpers.js';

const InputSchema = z.object({
  main_word: z.string().min(1).max(100),
  synonyms: z.array(z.string().min(1)).min(1).max(20),
  dry_run: z.boolean().default(false),
});
const OutputSchema = z.object({}).passthrough();

export const addSynonymTool = defineTool({
  name: 'add_synonym',
  description:
    'Adds search synonyms. main_word is the canonical term; synonyms are alternative spellings/phrasings. ' +
    'Example: main_word="iphone", synonyms=["apple iphone","i-phone"]. ' +
    'To remove a synonym, use dashboard (no delete tool — safety). Pass dry_run=true to preview.',
  category: 'mutation',
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  handler: async (input, ctx) =>
    runOrMock('add_synonym', input, ctx, async (i, c) => {
      if (i.dry_run) {
        return { _dry_run: true, would_add: { main_word: i.main_word, synonyms: i.synonyms } } as Record<string, unknown>;
      }
      const res = await c.client.post('/api/synonyms', { main_word: i.main_word, synonyms: i.synonyms });
      return res.data as Record<string, unknown>;
    }),
});
