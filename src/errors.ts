import { redact } from './logger.js';

export class RevelorMcpError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
    public readonly requestId: string,
  ) {
    super(redact(message));
    this.name = 'RevelorMcpError';
  }
}

type StructuredError = { code?: string; message?: string };
type UpstreamShape = {
  error?: StructuredError;
  detail?: string | { error?: StructuredError };
};

function extractUpstream(body: unknown): { code: string; message: string } {
  if (body == null || typeof body !== 'object') {
    return { code: 'UNKNOWN', message: 'No details' };
  }
  const u = body as UpstreamShape;

  // Public API v1 — structured error inside FastAPI `detail`
  if (u.detail && typeof u.detail === 'object' && u.detail.error) {
    return {
      code: u.detail.error.code ?? 'UNKNOWN',
      message: u.detail.error.message ?? 'No details',
    };
  }

  // Top-level structured error (legacy shape)
  if (u.error) {
    return {
      code: u.error.code ?? 'UNKNOWN',
      message: u.error.message ?? 'No details',
    };
  }

  // FastAPI default — `detail` jako string
  if (typeof u.detail === 'string') {
    return { code: 'UNKNOWN', message: u.detail };
  }

  return { code: 'UNKNOWN', message: 'No details' };
}

export function mapHttpError(status: number, body: unknown, requestId: string): RevelorMcpError {
  const { code: rawCode, message: upstreamMsg } = extractUpstream(body);

  // Fallback: pokud BE nevratil strukturovanou chybu, pouzij HTTP status jako kod.
  const code = (rawCode === 'UNKNOWN' && status >= 400) ? `HTTP_${status}` : rawCode;

  if (status >= 500) {
    return new RevelorMcpError(code, `Upstream server error (${status}): ${upstreamMsg} [request_id=${requestId}]`, status, requestId);
  }

  const friendly = translate4xx(status, code, upstreamMsg);
  return new RevelorMcpError(code, friendly, status, requestId);
}

function translate4xx(status: number, code: string, raw: string): string {
  switch (code) {
    case 'INVALID_TOKEN':
    case 'TOKEN_EXPIRED':
    case 'UNAUTHORIZED':
      return 'API token je neplatný nebo vypršel. Zkontroluj REVELOR_API_KEY v konfiguraci.';
    case 'INSUFFICIENT_SCOPE':
      return 'API token nemá potřebný scope pro tento nástroj. Zkontroluj scopes v dashboardu (Public API klíče).';
    case 'RATE_LIMIT_EXCEEDED':
      return 'Překročen rate limit (60 req/min per klíč). Počkej minutu a zkus znovu.';
    case 'MISSING_TENANT':
      return 'Tenant ID není vyřešitelné z tokenu. Zkontroluj REVELOR_TENANT_ID.';
    case 'TENANT_MISMATCH':
      return 'Token je vázaný na jiný tenant než v requestu. Zkontroluj REVELOR_TENANT_ID v configu — musí odpovídat tomu, pro který byl token vygenerovaný.';
    case 'HTTP_401':
      return `Endpoint vyžaduje admin autentizaci, kterou rvlr_ token nepodporuje. Tento MCP tool aktuálně nelze použít (status ${status}).`;
    case 'HTTP_403':
      return `Endpoint odmítl rvlr_ token (status ${status}). ${raw}`;
    case 'HTTP_404':
      return `Endpoint na BE neexistuje nebo není aktivní (status ${status}). ${raw}`;
    default:
      return `Klientská chyba (${status}/${code}): ${raw}`;
  }
}
