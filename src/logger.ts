import pino from 'pino';

const TOKEN_PATTERNS: RegExp[] = [
  /Bearer\s+[A-Za-z0-9._-]+/g,
  /rvlr_[A-Za-z0-9]+/g,
];

export function redact(input: string): string {
  let out = input;
  for (const re of TOKEN_PATTERNS) {
    out = out.replace(re, '***REDACTED***');
  }
  return out;
}

export function createLogger() {
  return pino({
    level: process.env.LOG_LEVEL ?? 'info',
    transport: { target: 'pino/file', options: { destination: 2 } },
    formatters: {
      log(obj) {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(obj)) {
          out[k] = typeof v === 'string' ? redact(v) : v;
        }
        return out;
      },
    },
  });
}

export const logger = createLogger();
