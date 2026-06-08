import { z, ZodTypeAny } from 'zod';
import type { AxiosInstance } from 'axios';
import { loadFixture } from './mock/fixture_loader.js';
import { TtlCache } from './cache.js';

export type ToolMode = 'readonly' | 'full' | 'mock';

export type ToolContext = {
  client: AxiosInstance;
  mode: ToolMode;
  cache: TtlCache<unknown>;
  tenantId: string;
};

export type ToolDef<Input extends ZodTypeAny, Output> = {
  name: string;
  description: string;
  inputSchema: Input;
  outputSchema: z.ZodType<Output>;
  category: 'readonly' | 'mutation';
  handler: (input: z.infer<Input>, ctx: ToolContext) => Promise<Output>;
};

export function defineTool<I extends ZodTypeAny, O>(def: ToolDef<I, O>): ToolDef<I, O> {
  return def;
}

const MAX_RESPONSE_BYTES = 100_000;

export function guardResponseSize<T>(data: T, toolName: string): T {
  const size = JSON.stringify(data).length;
  if (size > MAX_RESPONSE_BYTES) {
    return {
      _truncated: true,
      _original_size_bytes: size,
      _message: `Response for ${toolName} exceeded 100KB. Use pagination params (limit/offset) or narrower date range.`,
      _sample:
        typeof data === 'object' && data !== null && 'items' in (data as object)
          ? { ...(data as object), items: (data as { items?: unknown[] }).items?.slice(0, 5) }
          : data,
    } as unknown as T;
  }
  return data;
}

export async function runOrMock<I, O>(
  toolName: string,
  input: I,
  ctx: ToolContext,
  liveImpl: (input: I, ctx: ToolContext) => Promise<O>,
): Promise<O> {
  if (ctx.mode === 'mock') {
    return loadFixture<O>(toolName);
  }
  const result = await liveImpl(input, ctx);
  return guardResponseSize(result, toolName);
}
