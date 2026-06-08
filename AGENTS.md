# AGENTS.md — Auto-setup guide for AI assistants

> **For AI agents (Claude, Cursor, Copilot...):** if the user asks to install this MCP, follow these steps. **Ask for the minimum, do the rest yourself.**

## Goal

Add an entry to the user's MCP client config so it can talk to the user's Revelor instance.

---

## Step 1 — Ask the user for only TWO things

1. **API token** (starts with `rvlr_`)
   - Where to find: their Revelor dashboard → tab `🤖 API tokeny pro agenty` → `+ Nový token`
   - Choose **🛡️ MCP — read only** (safer) or **🚀 MCP — full access** (lets AI tune search).
   - User clicks `Kopírovat config` after creation — that block contains both the token and the URL ready to paste.

2. **Base URL** of their Revelor instance (e.g., `https://shop.revelor.cz`)
   - It's the URL they use to open the dashboard. They can copy from the address bar.

**DO NOT ask for:**
- Tenant ID — auto-derived from token at startup
- Mode (`readonly` / `full`) — auto-derived from token scopes
- Admin token / JWT — not needed; the `rvlr_` token covers everything

**Tip:** if the user pastes the entire "Kopírovat config" block from the dashboard, you already have everything — just adjust the entry name and merge into their existing config.

---

## Step 2 — Detect the MCP client

Most likely it's **Claude Desktop**. Locate the config file:

| OS | Path |
|----|------|
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

If the file doesn't exist, create it with `{ "mcpServers": {} }`.

For other clients see [§ Other MCP clients](#other-mcp-clients) below.

---

## Step 3 — Add this entry under `mcpServers`

```json
{
  "mcpServers": {
    "mcp-revelor": {
      "command": "npx",
      "args": ["-y", "@webotvurci-s-r-o/mcp-revelor"],
      "env": {
        "REVELOR_API_KEY": "<USER'S TOKEN — starts with rvlr_>",
        "REVELOR_BASE_URL": "<USER'S BASE URL — https://...>"
      }
    }
  }
}
```

If the file already has other MCP entries, **merge** — don't overwrite. Preserve existing servers.

---

## Step 4 — Multiple shops (only if the user has more than one)

For each additional shop, ask the user for one more token+URL and add a separate entry with a unique key:

```json
"mcpServers": {
  "mcp-revelor-shop-a": { "command": "npx", "args": ["-y", "@webotvurci-s-r-o/mcp-revelor"], "env": { "REVELOR_API_KEY": "rvlr_aaa...", "REVELOR_BASE_URL": "https://shop-a.revelor.cz" } },
  "mcp-revelor-shop-b": { "command": "npx", "args": ["-y", "@webotvurci-s-r-o/mcp-revelor"], "env": { "REVELOR_API_KEY": "rvlr_bbb...", "REVELOR_BASE_URL": "https://shop-b.revelor.cz" } }
}
```

Each token is server-side bound to its tenant — they cannot cross over.

---

## Step 5 — Tell the user to restart their MCP client

For Claude Desktop:
> "Now restart Claude Desktop — system tray → Quit Claude → reopen the app."

---

## Step 6 — Verify it works

In a fresh conversation, the user can try:

> *"Use Revelor MCP, call health"*

Expected: a JSON answer with `status`, `tenant_id`, and `components`. If you see that, setup worked.

---

## Step 7 — Onboard the user (proactively show what they can do)

**Important — don't leave the user wondering "now what?"** After you confirm setup works (Step 6), immediately give them a short welcome message tailored to their token type.

### If the token is read-only (`🛡️ MCP — read only`):

Send a message like this (translate to the user's language):

> **🎉 Setup hotov.** Tvůj AI asistent teď umí číst data z Revelor instance `<tenant_id>`. Můžeš se ptát například na:
>
> **📊 Performance & metriky**
> - *"Jak jsem na tom se searchem za posledních 30 dní?"*
> - *"Top 10 nejhledanějších slov za 90 dní"*
> - *"Konverzní rate ze search-sessions vs bez search"*
>
> **🔍 Problémy v searchi**
> - *"Co lidi hledají a nenajdou (zero-result queries)?"*
> - *"Jaké je průměrné CTR z výsledků vyhledávání?"*
> - *"Pomalé dotazy — kolik je p95 latence?"*
>
> **⚙️ Konfigurace**
> - *"Ukaž mi moje aktuální synonyma"*
> - *"Jaké recommendation strategie mám zapnuté?"*
>
> Stačí napsat normální větu, AI vybere správný nástroj sám.
>
> *Pozn.: tvůj token je read-only — pro úpravy (synonyma, pinning, váhy) vygeneruj v dashboardu token s rolí 🚀 MCP — full access.*

### If the token is full-access (`🚀 MCP — full access`):

Same as above + ADD this block:

> **🛠️ Úpravy přes AI** (full-access token)
> Můžeš nechat AI rovnou ladit search za sebe:
> - *"Přidej synonymum mobil → telefon, dry-run"*
> - *"Pinni produkt ABC na pozici 1 v Vánoce kategorii"*
> - *"Skryj produkt XYZ ze searche"*
> - *"Boostni produkt DEF s manual_boost 2.0"*
> - *"Zvyš click_weight v rankingu z 1.0 na 1.3"*
>
> AI vždy ukáže `dry_run` plán a počká na tvoje potvrzení před zápisem.

### Tone guidelines

- **Use the user's language** (Czech most of the time; ask if unsure)
- **3–5 starter prompts** per category — not 20 (don't overwhelm)
- **Pick examples relevant to e-commerce** (e-shop, search, conversion, synonyma)
- **Tell them about the safety net**: "AI nemůže smazat data, číst customery, ani opustit tvůj shop"

### Full list of categories & prompts

See [docs/EXAMPLES.md](docs/EXAMPLES.md) for the comprehensive list (~30 prompts across 7 categories). Don't paste the whole file — pick 5–10 most relevant.

---

## Other MCP clients

### Cursor
Path: `~/.cursor/mcp.json` (same JSON structure as above)

### Claude Code (CLI)
One command:
```bash
claude mcp add mcp-revelor \
  --env REVELOR_API_KEY=<token> \
  --env REVELOR_BASE_URL=<url> \
  -- npx -y @webotvurci-s-r-o/mcp-revelor
```

### Custom / generic MCP client
The MCP server uses **stdio transport**. Spawn `npx -y @webotvurci-s-r-o/mcp-revelor` as a child process with the two env vars and talk JSON-RPC over stdin/stdout.

---

## Troubleshooting (common errors)

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `INVALID_TOKEN` / `401` | Token doesn't start with `rvlr_`, or was deleted in dashboard | Regenerate token |
| `TENANT_MISMATCH` | `REVELOR_BASE_URL` points to a different tenant than where the token was generated | Match base URL to the dashboard where you created the token |
| `INSUFFICIENT_SCOPE` | User asked AI to do a write operation but token is read-only | Regenerate token with `🚀 MCP — full access` role |
| `RATE_LIMIT_EXCEEDED` | Too many requests (60 / 60s per token) | Wait one minute, then retry |
| `TOKEN_EXPIRED` | Token expired (default TTL 90 days) | Regenerate token in dashboard |
| MCP server doesn't appear in Claude | Config JSON syntax error, or Claude wasn't restarted | Validate JSON, restart Claude Desktop completely |
| `command not found: npx` | Node.js not installed | Install Node.js ≥20 from nodejs.org |

---

## What the AI gets access to

**17 tools** total — only metrics, configuration inspection, and search-tuning mutations:
- 11 read tools (analytics, health, recommendations, settings, anonymized search logs)
- 6 write tools (synonyms, top items, product hide/score, CTR weights) — `full` mode only
- **NO** delete tools, **NO** PII (customers / orders), **NO** debug introspection

Mutations support `dry_run` so the AI shows the plan before applying.

See [README.md](README.md) § *Security model* for full guarantees.

---

## TL;DR for AI

1. Ask user for `rvlr_` token and Revelor base URL.
2. Find `claude_desktop_config.json` (or equivalent).
3. Merge in the `mcp-revelor` entry shown in Step 3.
4. Tell user to restart Claude Desktop.
5. After restart: verify with *"Use Revelor MCP, call health"*.
6. **Onboard** — send the welcome message from Step 7 with 5–10 example prompts. Don't leave user with "now what?".

Done.
