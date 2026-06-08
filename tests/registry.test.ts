import { describe, it, expect } from 'vitest';
import { getActiveTools, listAllTools } from '../src/tools/registry.js';
import '../src/tools/readonly/_all.js';
import '../src/tools/mutations/_all.js';

describe('tool registry mode gating', () => {
  it('readonly mode contains only readonly category', () => {
    const tools = getActiveTools('readonly');
    expect(tools.length).toBeGreaterThan(0);
    expect(tools.every((t) => t.category === 'readonly')).toBe(true);
  });

  it('readonly mode does NOT contain any mutation tool names', () => {
    const names = getActiveTools('readonly').map((t) => t.name);
    const mutationNames = [
      'pin_top_item', 'update_top_item_position', 'set_product_score',
      'set_product_hidden', 'add_synonym', 'update_ctr_weights',
    ];
    for (const m of mutationNames) {
      expect(names).not.toContain(m);
    }
  });

  it('full mode contains both readonly + mutations', () => {
    const tools = getActiveTools('full');
    expect(tools.some((t) => t.category === 'readonly')).toBe(true);
    expect(tools.some((t) => t.category === 'mutation')).toBe(true);
  });

  it('total registered = 17 (11 readonly + 6 mutations)', () => {
    expect(listAllTools().length).toBe(17);
  });

  it('trigger_feed_sync is NOT registered (intentionally excluded — operational risk)', () => {
    const names = listAllTools().map((t) => t.name);
    expect(names).not.toContain('trigger_feed_sync');
  });

  it('debug_* tools are NOT registered (removed — reveal scoring internals)', () => {
    const names = listAllTools().map((t) => t.name);
    expect(names).not.toContain('debug_query');
    expect(names).not.toContain('debug_index_fields');
    expect(names).not.toContain('debug_typo_correction');
    expect(names).not.toContain('debug_suggestions_trace');
  });
});
