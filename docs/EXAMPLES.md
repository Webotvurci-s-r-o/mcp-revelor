# Example prompts for Revelor MCP

## Readonly — analytics

> What are my most common zero-result search queries last week? Take top 10.

> Compare conversion rate from search this month vs last month.

> How fast is search responding right now? Are there outliers?

## Debug investigation (readonly with admin token)

> Why does query "iphone 15 černý" return nothing? Run debug_query and explain.

> Check fill-rate of critical indexed fields — do you see anything that could break search?

> Test typo correction for "iphon" — what suggestions does the engine produce?

## Full mode — actions

> Sync products feed, I just uploaded new ones.

> Pin product with GUID `abc-123` to first position in Christmas category top items.

> Add synonyms: for "iphone" → "apple iphone", "i-phone".

> Increase click_weight in ranking from 1.0 to 1.5, but give me dry_run preview first.

## Sales demo (mock mode)

Run MCP with `REVELOR_MCP_MODE=mock` and ask anything — returns fictive data from bundled fixtures.

> Show me search KPIs and recommend what we could improve.

> What products are getting low recommendation CTR? Suggest why.
