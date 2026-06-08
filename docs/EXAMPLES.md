# Example prompts for Revelor MCP

After installation, try any of these in your AI chat (Claude Desktop, Cursor, etc.).

---

## 📊 Daily / weekly performance check

> *"How's my Revelor search performance for the last 7 days? Total searches, CTR, conversion rate."*

> *"Show me a daily breakdown of search volume for the last 30 days."*

> *"What's my zero-result rate? Has it changed compared to the previous week?"*

---

## 🔍 Discover problems (the "what's broken" prompts)

> *"What are my top 20 zero-result queries this month? People searched for these and got nothing."*

> *"Compare conversion rate from search-sessions vs no-search-sessions for the last 30 days. Is search lifting conversions?"*

> *"Average search response time over the last 7 days — any outliers?"*

> *"Top 50 most-searched words last 90 days, sorted by count. Highlight ones with low result count."*

---

## 🎯 Recommendations & relevance check

> *"What recommendations are being shown on the homepage? Are they performing — CTR, conversion?"*

> *"Which products get clicked most from recommendation widgets? Top 20 over 30 days."*

> *"Are my partner / affiliate recommendations driving revenue? Show last-30-days analytics."*

---

## ⚙️ Configuration inspection

> *"Show me my current synonyms config from Revelor settings."*

> *"What recommendation strategies are currently active for which placements?"*

> *"What are my CTR ranking weights right now?"*

---

## 🛠️ AI-assisted search tuning (`full` mode only)

> *"Add a synonym 'mobil → telefon, mobilní telefon'. Dry-run first."*

> *"Pin product GUID `abc-123` to position 1 in top items for category 'Christmas'."*

> *"Hide product GUID `xyz-456` from search — out of stock long-term."*

> *"Increase click_weight in ranking from 1.0 to 1.3 — show me the dry-run preview first, then apply if I confirm."*

> *"Boost product GUID `vip-789` with manual_boost 2.0."*

---

## 🧠 Strategic / exploratory

> *"Based on my last-30-days search analytics, suggest 3 improvements to ranking or synonyms."*

> *"Find my most-searched-but-zero-result queries and propose synonyms that would fix them. Use dry-run for each."*

> *"What category gets the worst CTR from search results? Why might that be?"*

---

## 🔐 Safety net — what the AI cannot do

The AI will refuse / get a 403 if you ask for:
- Deleting any data (no delete endpoints exist)
- Customer / order data (no PII access)
- Cross-tenant access (token is locked to your shop)
- Triggering scheduled sync, restarting services, modifying user accounts
- Internal scoring / debug introspection (not exposed via MCP)

All mutations support `dry_run` — preview before commit.

---

## Multi-tenant

If you configured multiple Revelor instances (`mcp-revelor-shop-a`, `mcp-revelor-shop-b`), the AI knows about all of them. Address them by name:

> *"In `mcp-revelor-shop-a`, what's the top searched word?"*

> *"Compare CTR between shop-a and shop-b for last week."*

---

## Sales / development demo (mock mode)

Run MCP with `REVELOR_MCP_MODE=mock` (no live BE, no token needed) — returns bundled fixture data:

> *"Show me search KPIs and recommend what we could improve."*

> *"What products are getting low recommendation CTR? Suggest why."*
