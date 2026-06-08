import { describe, it, expect } from 'vitest';
import { redact } from '../src/logger.js';

describe('redact', () => {
  it('redacts rvlr_ tokens', () => {
    expect(redact('Authorization: Bearer rvlr_abc123XYZ')).toBe(
      'Authorization: ***REDACTED***',
    );
  });
  it('redacts Bearer tokens generically', () => {
    expect(redact('Bearer eyJhbGciOiJIUzI1NiJ9.foo.bar')).toBe('***REDACTED***');
  });
  it('redacts raw rvlr_ in any context', () => {
    expect(redact('token=rvlr_xyz789ABC end')).toBe('token=***REDACTED*** end');
  });
  it('leaves normal strings alone', () => {
    expect(redact('user logged in')).toBe('user logged in');
  });
});
