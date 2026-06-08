# @webotvurci-s-r-o/mcp-revelor

MCP server for [Revelor](https://revelor.cz) — let Claude Desktop / Cursor / Claude Code talk to your e-shop data.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## What it does

Connects an AI assistant to your Revelor analytics, search configuration, and recommendation data:

- **Read** — health, search KPIs, conversions, top queries, recommendations, settings
- **Write** (optional) — add synonyms, pin top items, hide products, tune CTR weights
- **Mock mode** — offline mode with bundled fixtures for development

## Quick start

### 1. Generate an API token in your Revelor dashboard

Go to `API tokeny pro agenty` → `+ Nový token` → choose a role:
- 🛡️ **MCP — read only** (read access)
- 🚀 **MCP — full access** (read + AI-assisted search tuning)

Click **`Kopírovat config`** to copy a ready-to-paste JSON block.

### 2. Paste into your Claude Desktop config

Edit `claude_desktop_config.json`:

| OS | Path |
|----|------|
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

```json
{
  "mcpServers": {
    "mcp-revelor": {
      "command": "npx",
      "args": ["-y", "@webotvurci-s-r-o/mcp-revelor"],
      "env": {
        "REVELOR_API_KEY": "rvlr_yourtoken",
        "REVELOR_BASE_URL": "https://yourtenant.revelor.cz"
      }
    }
  }
}
```

Two fields. **Tenant ID and mode are auto-derived** from the token at startup.

### 3. Restart Claude Desktop

The MCP server starts automatically. Open a new conversation and ask:

> *"What's my Revelor search performance for the last 30 days?"*

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `REVELOR_API_KEY` | yes | Bearer token (`rvlr_*`) from your dashboard |
| `REVELOR_BASE_URL` | yes | HTTPS URL of your Revelor instance |
| `REVELOR_TENANT_ID` | no | Auto-derived from token. Override only if needed. |
| `REVELOR_MCP_MODE` | no | `auto` (default) \| `readonly` \| `full` \| `mock` |
| `REVELOR_HTTP_TIMEOUT_MS` | no | Request timeout (default 30000) |
| `REVELOR_CACHE_TTL_MS` | no | In-memory cache TTL (default 30000) |

## Multiple tenants

If you manage multiple Revelor instances, add separate entries under `mcpServers`:

```json
{
  "mcpServers": {
    "mcp-revelor-shop-a": {
      "command": "npx",
      "args": ["-y", "@webotvurci-s-r-o/mcp-revelor"],
      "env": {
        "REVELOR_API_KEY": "rvlr_aaaaaaa",
        "REVELOR_BASE_URL": "https://shop-a.revelor.cz"
      }
    },
    "mcp-revelor-shop-b": {
      "command": "npx",
      "args": ["-y", "@webotvurci-s-r-o/mcp-revelor"],
      "env": {
        "REVELOR_API_KEY": "rvlr_bbbbbbb",
        "REVELOR_BASE_URL": "https://shop-b.revelor.cz"
      }
    }
  }
}
```

Generate a separate token per tenant — each token is bound to its tenant on the server side.

## What the AI can do

**Readonly mode (11 tools):**

- Overall health and sync status
- Search KPIs (CTR, zero-result rate, top queries, time series — up to 90 days)
- Search performance (latency, cache hit rate)
- Conversion impact of search vs no-search sessions
- Recommendations and their performance metrics
- Anonymized search logs
- Partner-level analytics
- Settings inspection (synonyms config, recommender setup, etc.)

**Full mode (17 tools)** adds 6 mutation tools for AI-assisted search tuning:

- `add_synonym` — add new synonyms
- `pin_top_item` / `update_top_item_position` — promote / reorder featured products
- `set_product_hidden` — hide products from search results
- `set_product_score` — manually boost / demote products
- `update_ctr_weights` — adjust ranking algorithm weights

All mutations support a `dry_run` parameter so the AI shows you the plan before applying.

## Security model

- **Tenant isolation** — every request is locked to the tenant the token was issued for. AI cannot cross over to other tenants.
- **Scope enforcement** — read-only tokens cannot trigger write tools (403 from server).
- **No DELETE** — destructive operations are not exposed via MCP. Manage deletions in the dashboard.
- **No PII** — order data, customer details, and identifying info are not accessible via MCP.
- **No debug introspection** — internal scoring / indexing logic is not exposed. Diagnostics live in the dashboard for admin users.
- **Token TTL** — every token expires (default 90 days, max 365). Revoke instantly in the dashboard if compromised.
- **Rate limiting** — 60 requests / 60 s per token on admin endpoints. DoS-resistant.
- **Token redaction** — tokens are never echoed in logs.
- **HTTPS-only** — `localhost` is the only non-HTTPS exception (for development).

## Development

```bash
git clone https://github.com/Webotvurci-s-r-o/mcp-revelor.git
cd mcp-revelor
npm install
npm test
npm run build
```

## License

MIT — see [LICENSE](LICENSE).
