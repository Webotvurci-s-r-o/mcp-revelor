import { describe, it, expect } from 'vitest';
import { mapHttpError, RevelorMcpError } from '../src/errors.js';

describe('mapHttpError', () => {
  it('translates 401 to friendly message', () => {
    const e = mapHttpError(401, { error: { code: 'INVALID_TOKEN', message: 'Bad token' } }, 'req-1');
    expect(e).toBeInstanceOf(RevelorMcpError);
    expect(e.message).toMatch(/token/i);
    expect(e.requestId).toBe('req-1');
    expect(e.statusCode).toBe(401);
  });
  it('translates 403 scope error', () => {
    const e = mapHttpError(403, { error: { code: 'INSUFFICIENT_SCOPE' } }, 'req-2');
    expect(e.message).toMatch(/scope/i);
  });
  it('translates 429 rate limit', () => {
    const e = mapHttpError(429, { error: { code: 'RATE_LIMIT_EXCEEDED' } }, 'req-3');
    expect(e.message).toMatch(/rate limit/i);
  });
  it('passes 5xx through as raw', () => {
    const e = mapHttpError(500, { error: { code: 'INTERNAL_ERROR', message: 'boom' } }, 'req-4');
    expect(e.message).toMatch(/boom/);
    expect(e.message).toMatch(/req-4/);
  });
  it('redacts tokens from upstream messages (S9)', () => {
    const e = mapHttpError(500, { error: { message: 'token rvlr_secret123 failed' } }, 'r');
    expect(e.message).not.toContain('rvlr_secret123');
  });

  it('unwraps FastAPI detail wrapper with structured error', () => {
    const e = mapHttpError(
      401,
      { detail: { error: { code: 'UNAUTHORIZED', message: 'Valid Bearer rvlr_ token required' } } },
      'req-5',
    );
    expect(e.code).toBe('UNAUTHORIZED');
    expect(e.message).toMatch(/token/i);
  });

  it('handles FastAPI detail-as-string (admin endpoints)', () => {
    const e = mapHttpError(401, { detail: 'Autorizace vyžadována' }, 'req-6');
    expect(e.code).toBe('HTTP_401');
    expect(e.message).toMatch(/admin/i);
  });

  it('falls back to HTTP_<status> when no structured error', () => {
    const e = mapHttpError(404, { detail: 'Not Found' }, 'req-7');
    expect(e.code).toBe('HTTP_404');
    expect(e.message).toMatch(/neexistuje|404/i);
  });

  it('handles empty body (no detail, no error)', () => {
    const e = mapHttpError(400, {}, 'req-8');
    expect(e.code).toBe('HTTP_400');
    expect(e.message).toMatch(/400/);
  });
});
