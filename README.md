# @webotvurci-s-r-o/mcp-revelor

MCP server pro [Revelor](https://revelor.cz) — nech Claude Desktop / Cursor / Claude Code mluvit s daty tvého e-shopu.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## K čemu to slouží

Připojuje AI asistenta k tvým Revelor analytikám, nastavení vyhledávání a doporučení:

- **Čtení** — health, search KPI, konverze, top dotazy, doporučení, nastavení
- **Zápis** (volitelný) — přidávání synonym, pinování top produktů, skrývání položek, ladění CTR vah
- **Mock režim** — offline mode s vestavěnými fixtures pro vývoj

## Rychlý start (3 kroky)

### 1. Vygeneruj API token v Revelor dashboardu

Otevři `🤖 API tokeny pro agenty` → klikni `+ Nový token` → vyber roli:
- 🛡️ **MCP — read only** (pouze čtení)
- 🚀 **MCP — full access** (čtení + AI ladění vyhledávání)

Klikni **`Kopírovat config`** — dostaneš hotový JSON blok k vložení.

### 2. Vlož do Claude Desktop configu

Otevři `claude_desktop_config.json`:

| OS | Cesta |
|----|-------|
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

```json
{
  "mcpServers": {
    "mcp-revelor": {
      "command": "npx",
      "args": ["-y", "github:Webotvurci-s-r-o/mcp-revelor"],
      "env": {
        "REVELOR_API_KEY": "rvlr_tvuj_token",
        "REVELOR_BASE_URL": "https://tvuje-shop.revelor.cz"
      }
    }
  }
}
```

Stačí **2 fieldy**. Tenant ID a režim se odvodí z tokenu automaticky při startu.

### 3. Restartuj Claude Desktop

MCP server naběhne automaticky. V nové konverzaci napiš:

> *„Jak je na tom můj Revelor search za posledních 30 dní?"*

## Co teď můžu chtít?

Viz [docs/EXAMPLES.md](docs/EXAMPLES.md) — ~30 příkladů promptů rozdělených do kategorií (analytika, problémy, doporučení, konfigurace, AI ladění...).

**Hned se můžeš zeptat třeba:**

- *„Top 10 nejhledanějších slov za 90 dní"*
- *„Zero-result dotazy z minulého týdne"*
- *„Konverzní rate ze search-sessions vs bez search"*
- *„Ukaž moje aktuální synonyma"*
- *„Přidej synonymum mobil → telefon, dry-run"* (jen `full` mode)

## Proměnné prostředí (env)

| Proměnná | Povinné | Popis |
|----------|---------|-------|
| `REVELOR_API_KEY` | ano | Bearer token (`rvlr_*`) z dashboardu |
| `REVELOR_BASE_URL` | ano | HTTPS URL tvé Revelor instance |
| `REVELOR_TENANT_ID` | ne | Auto-derived z tokenu. Nastavit jen pokud chceš override. |
| `REVELOR_MCP_MODE` | ne | `auto` (default) \| `readonly` \| `full` \| `mock` |
| `REVELOR_HTTP_TIMEOUT_MS` | ne | Timeout requestu (default 30 000 ms) |
| `REVELOR_CACHE_TTL_MS` | ne | TTL in-memory cache (default 30 000 ms) |

## Více obchodů (multi-tenant)

Pokud spravuješ víc Revelor instancí, přidej více záznamů pod `mcpServers` s unikátními klíči:

```json
{
  "mcpServers": {
    "mcp-revelor-eshop-a": {
      "command": "npx",
      "args": ["-y", "github:Webotvurci-s-r-o/mcp-revelor"],
      "env": {
        "REVELOR_API_KEY": "rvlr_aaa...",
        "REVELOR_BASE_URL": "https://eshop-a.revelor.cz"
      }
    },
    "mcp-revelor-eshop-b": {
      "command": "npx",
      "args": ["-y", "github:Webotvurci-s-r-o/mcp-revelor"],
      "env": {
        "REVELOR_API_KEY": "rvlr_bbb...",
        "REVELOR_BASE_URL": "https://eshop-b.revelor.cz"
      }
    }
  }
}
```

Pro každý obchod vygeneruj samostatný token — každý je serverside vázán na svůj tenant.

## Co AI umí

**Read-only režim (11 tools):**

- Celkový health + sync status
- Search KPI (CTR, zero-result rate, top dotazy, časové řady — až 90 dní zpět)
- Search performance (latence, cache hit rate)
- Konverzní dopad searche (search vs no-search sessions)
- Doporučení (recommendations) a jejich performance
- Anonymizované search logy
- Partner analytika
- Inspekce nastavení (synonyma, recommender setup, ...)

**Full režim (17 tools)** přidává 6 mutací pro AI-asistované ladění:

- `add_synonym` — přidat synonyma
- `pin_top_item` / `update_top_item_position` — pin / přeřadit top produkty
- `set_product_hidden` — skrýt produkt z výsledků vyhledávání
- `set_product_score` — manuální boost / demote produktu
- `update_ctr_weights` — upravit váhy v ranking algoritmu

Všechny mutace podporují `dry_run` parameter — AI ti ukáže plán před aplikací.

## Bezpečnost

- **Tenant izolace** — každý request zamknutý na tenant, na který byl token vystaven. AI nemůže přejít na jiný tenant.
- **Scope enforcement** — read-only token nedokáže spustit write tooly (403 ze serveru).
- **Žádný DELETE** — destruktivní operace nejsou přes MCP dostupné. Mazání pouze v dashboardu.
- **Žádné PII** — objednávky, zákazníci, identifikační údaje nejsou přes MCP přístupné.
- **Žádná debug introspekce** — vnitřní scoring / indexing logika není přístupná. Diagnostika je pouze v dashboardu pro admina.
- **Token TTL** — každý token expiruje (default 90 dní, max 365). Revoke okamžitě v dashboardu při kompromitaci.
- **Rate limiting** — 60 requestů / 60 sekund per token na admin endpointech. DoS-resistant.
- **Token redakce** — tokeny nikdy nejsou loggované ve výpisu.
- **Pouze HTTPS** — `localhost` je jediná non-HTTPS výjimka (pro vývoj).

## Vývoj

```bash
git clone https://github.com/Webotvurci-s-r-o/mcp-revelor.git
cd mcp-revelor
npm install
npm test
npm run build
```

## Licence

MIT — viz [LICENSE](LICENSE).
