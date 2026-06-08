import { describe, it, expect, afterEach } from 'vitest';
import { addSynonymTool } from '../../../src/tools/mutations/add_synonym.js';
import { mockRevelor, cleanup } from '../../helpers/mock_revelor.js';
import { createHttpClient } from '../../../src/http_client.js';
import { TtlCache } from '../../../src/cache.js';

afterEach(cleanup);
const ctx = () => ({
  client: createHttpClient({
    baseUrl: 'https://test.revelor.cz', apiKey: 'rvlr_x',
    adminToken: 'jwt.admin', tenantId: '123456', httpTimeoutMs: 1000,
  }),
  mode: 'full' as const,
  cache: new TtlCache(0),
  tenantId: '123456',
});

describe('add_synonym', () => {
  it('dry_run preview', async () => {
    const res = await addSynonymTool.handler({ main_word: 'x', synonyms: ['y'], dry_run: true }, ctx());
    expect((res as { _dry_run: boolean })._dry_run).toBe(true);
  });
  it('POSTs to /api/synonyms with admin auth', async () => {
    const scope = mockRevelor()
      .post('/api/synonyms', { main_word: 'iphone', synonyms: ['apple iphone'] })
      .matchHeader('authorization', 'Bearer jwt.admin')
      .reply(201, { id: 'syn-1' });
    await addSynonymTool.handler({ main_word: 'iphone', synonyms: ['apple iphone'], dry_run: false }, ctx());
    expect(scope.isDone()).toBe(true);
  });
});
