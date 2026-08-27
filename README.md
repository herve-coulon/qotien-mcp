# Qotien — French Tax & Retirement MCP

**A sourced, dated calculation API for French personal taxation and retirement, exposed over MCP.** Every response carries a confidence level, its legal sources, and the fiscal year — the engine never guesses a fact.

> Hosted, public, free. No authentication. Rate-limited per IP. No personal data — inputs are abstract numbers (income, parts, pension points), never stored.

## Connect

| | |
|---|---|
| **MCP endpoint** (Streamable HTTP / JSON-RPC 2.0) | `https://app.qotien.fr/api/fiscal/v1/mcp` |
| **REST** | `POST https://app.qotien.fr/api/fiscal/v1/calculate` |
| **Manifest** (discovery) | `GET https://app.qotien.fr/api/fiscal/v1/manifest` |

Add it to any MCP client that supports a remote Streamable HTTP server, pointing at the endpoint above.

## Why call this instead of computing it yourself

A general LLM (or a code interpreter) *can* do arithmetic, but it does **not** reliably know the current, exact French rules — the 2026 income-tax brackets and décote thresholds, the value of an Agirc-Arrco or CARMF pension point, the reversion rate of each fund. It will produce a confident, wrong number. Qotien is **up to date, sourced, and re-verified against primary sources at every release** — the value where a tax or pension error is unacceptable (fintech, insurtech, advisory tools, wealth-management software).

## Tools — 2 domains, 10 tools

### Fiscal (income tax & wealth) — deterministic, `confiance: fiable`
- `fiscal_impot_revenu` — income tax (progressive brackets, family quotient, décote)
- `fiscal_tmi` — marginal tax rate
- `fiscal_cehr` — exceptional contribution on high incomes
- `fiscal_prelevements_sociaux` — social-levy rate by income type
- `fiscal_surtaxe_pv_immobiliere` — real-estate capital-gains surtax

### Retirement — variable confidence, never a bare figure
- `retraite_ps_pension` (`fiable`) — pension gross→net (CSG/CRDS/CASA + 1% health on the complementary part)
- `retraite_pension_regime` (`fiable`) — pension of one points-based scheme (28 funds) with a plausibility guard
- `retraite_pension_totale` (`fiable`) — consolidated multi-scheme pension (the full career statement in one call), gross→net
- `retraite_regimes` (`fiable`) — discovery: the computable schemes
- `retraite_estimation` (`estime`/`partiel`/`non_calculable`) — approximate pension from partial data, with a range and a confidence level

## Response contract

```json
{
  "ok": true,
  "domaine": "retraite",
  "confiance": "fiable",
  "result": { "...": "..." },
  "sources": ["references_officielles.json v0.6.0", "retraite_registre.js", "..."],
  "millesime_fiscal": "2026",
  "avertissement": "Deterministic indicative result — not personalized advice (CIF/DDA)."
}
```
- `confiance`: `fiable` (deterministic, golden-tested) · `estime`/`partiel` (approximation) · `non_calculable` (honest refusal instead of a made-up number).
- A pension is **never** returned as a bare number — confidence and sources travel with it.

## Quick start

```bash
# List tools
curl -s -X POST https://app.qotien.fr/api/fiscal/v1/mcp \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Agirc-Arrco pension: 750.07 points → 1079 €/year (confiance: fiable, sources attached)
curl -s -X POST https://app.qotien.fr/api/fiscal/v1/mcp \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"retraite_pension_regime","arguments":{"code_regime":"agirc_arrco","points":750.07}}}'

# REST — income tax for a 50 000 € household, 1 part
curl -s -X POST https://app.qotien.fr/api/fiscal/v1/calculate \
  -H 'content-type: application/json' \
  -d '{"capability":"impot_revenu","input":{"revenu_net_imposable":50000,"parts":1}}'
```

## Protocol

MCP `2025-06-18`. Methods: `initialize`, `tools/list`, `tools/call`, `ping`. Transport: JSON-RPC 2.0 over HTTP POST; the endpoint also serves a keepalive SSE stream on GET (`Accept: text/event-stream`) for clients that open the server→client channel.

## Disclaimer

Results are deterministic indicative computations based on the French tax & social-security reference for the stated fiscal year. They are the raw output of a calculation engine and **do not constitute personalized financial advice** within the meaning of French CIF/DDA regulation.

---
*Part of [Qotien](https://qotien.fr) — the reference for French personal-finance data: aggregated, sourced, dated, re-verified every year. Human-readable (qotien.fr) and machine-readable (this MCP).*
