import type { ToolDef, ToolMode } from '../tool_helpers.js';
import type { ZodTypeAny } from 'zod';

const allTools: ToolDef<ZodTypeAny, unknown>[] = [];

export function registerTool<I extends ZodTypeAny, O>(tool: ToolDef<I, O>): void {
  allTools.push(tool as unknown as ToolDef<ZodTypeAny, unknown>);
}

export function getActiveTools(mode: ToolMode): ToolDef<ZodTypeAny, unknown>[] {
  if (mode === 'readonly') {
    return allTools.filter((t) => t.category === 'readonly');
  }
  return allTools;
}

export function listAllTools(): ToolDef<ZodTypeAny, unknown>[] {
  return allTools;
}
