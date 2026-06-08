import { describe, it, expect, afterEach } from 'vitest';
import { updateTopItemPositionTool } from '../../../src/tools/mutations/update_top_item_position.js';
import { mockRevelor, cleanup } from '../../helpers/mock_revelor.js';
import { createHttpClient } from '../../../src/http_client.js';
import { TtlCache } from '../../../src/cache.js';

afterEach(cleanup);
const ctx = () => ({
  client: createHttpClient({
    baseUrl: 'https://test.revelor.cz',
    apiKey: 'rvlr_x',
    adminToken: 'jwt.admin',
    tenantId: '123456',
    httpTimeoutMs: 1000,
  }),
  mode: 'full' as const,
  cache: new TtlCache(0),
  tenantId: '123456',
});

describe('update_top_item_position', () => {
  it('dry_run preview skips HTTP', async () => {
    const res = await updateTopItemPositionTool.handler(
      { item_id: 'products:guid-123', new_position: 3, dry_run: true },
      ctx(),
    );
    expect((res as { _dry_run: boolean })._dry_run).toBe(true);
    expect((res as { would_update: { item_id: string; new_position: number } }).would_update).toEqual({
      item_id: 'products:guid-123',
      new_position: 3,
    });
  });

  it('PUTs to /top-items/:id with admin token', async () => {
    const scope = mockRevelor()
      .put('/top-items/products%3Aabc', { position: 5 })
      .matchHeader('authorization', 'Bearer jwt.admin')
      .reply(200, { id: 'products:abc', position: 5 });
    await updateTopItemPositionTool.handler(
      { item_id: 'products:abc', new_position: 5, dry_run: false },
      ctx(),
    );
    expect(scope.isDone()).toBe(true);
  });

  it('rejects new_position out of range', () => {
    const result = updateTopItemPositionTool.inputSchema.safeParse({
      item_id: 'products:abc',
      new_position: 11,
    });
    expect(result.success).toBe(false);
  });

  it('category is mutation', () => {
    expect(updateTopItemPositionTool.category).toBe('mutation');
  });
});
