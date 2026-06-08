# Příklady promptů pro Revelor MCP

Po instalaci zkus v AI chatu (Claude Desktop, Cursor...) cokoli z níže uvedeného.

---

## 📊 Denní / týdenní performance check

> *„Jak je na tom můj Revelor search za posledních 7 dní? Total search, CTR, conversion rate."*

> *„Ukaž denní rozložení search volume za posledních 30 dní."*

> *„Jaký mám zero-result rate? Změnilo se to oproti minulému týdnu?"*

---

## 🔍 Najít problémy v searchi

> *„Co lidi nejvíc hledali a nic nenašli (top 20 zero-result queries za měsíc)?"*

> *„Porovnej conversion rate sessions s searchem vs bez searche za 30 dní. Zvyšuje search konverze?"*

> *„Průměrná response time vyhledávání za posledních 7 dní — najdi outliers."*

> *„Top 50 nejhledanějších slov za 90 dní, seřaď podle počtu. Vyznač ta s nízkým počtem výsledků."*

---

## 🎯 Doporučení (recommendations) & relevance

> *„Jaká doporučení se zobrazují na homepage? Performují? Ukaž CTR a konverze."*

> *„Které produkty se nejvíc klikají z recommendation widgetů? Top 20 za 30 dní."*

> *„Vydělávají moje partner recommendation analytics? Ukaž last-30-days."*

---

## ⚙️ Konfigurace (jen čtení)

> *„Ukaž mi moje aktuální synonyma."*

> *„Jaké recommendation strategie mám zapnuté pro které placement?"*

> *„Jaké mám CTR ranking váhy v rankingu?"*

---

## 🛠️ AI ladění vyhledávání (jen `full` mode)

> *„Přidej synonymum 'mobil → telefon, mobilní telefon'. Dry-run nejdřív."*

> *„Pinni produkt GUID `abc-123` na pozici 1 do top items v kategorii 'Vánoce'."*

> *„Skryj produkt GUID `xyz-456` z vyhledávání — dlouhodobě nedostupný."*

> *„Zvyš click_weight v rankingu z 1.0 na 1.3 — ukaž dry-run preview a počkej na potvrzení, pak aplikuj."*

> *„Boostni produkt GUID `vip-789` s manual_boost 2.0."*

---

## 🧠 Strategická / průzkumná analytika

> *„Na základě analytiky za posledních 30 dní mi navrhni 3 zlepšení v rankingu nebo synonymech."*

> *„Najdi moje nejvíc hledané a nenalezené dotazy a navrhni synonyma co by je řešila. Pro každé dry-run."*

> *„Která kategorie má nejhorší CTR ze search výsledků? Co s tím?"*

---

## 🔐 Bezpečnostní strop — co AI **nedokáže**

AI dostane 403 / odmítnutí pokud chceš:
- Smazat data (žádné delete endpointy neexistují)
- Číst zákaznická data / objednávky (žádný PII přístup)
- Cross-tenant přístup (token je vázaný na tvůj shop)
- Spouštět scheduled sync, restartovat služby, upravovat user accounts
- Vnitřní scoring / debug introspekci (není přes MCP vystavená)

Všechny mutace podporují `dry_run` — AI ukáže plán před aplikací.

---

## Více obchodů (multi-tenant)

Pokud máš nakonfigurováno víc Revelor instancí (`mcp-revelor-eshop-a`, `mcp-revelor-eshop-b`), AI vidí všechny. Adresuj je jménem:

> *„V `mcp-revelor-eshop-a` co je nejhledanější slovo?"*

> *„Porovnej CTR mezi shop-a a shop-b za minulý týden."*

---

## Sales / dev demo (mock mode)

Spusť MCP s `REVELOR_MCP_MODE=mock` (žádný live BE, žádný token) — vrátí vestavěná fixture data:

> *„Ukaž search KPI a doporuč co by se dalo zlepšit."*

> *„Které produkty mají nízký recommendation CTR? Proč?"*
