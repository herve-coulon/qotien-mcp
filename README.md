# Qotien — French Tax & Retirement MCP

**A sourced, dated calculation API for French personal taxation and retirement, exposed over MCP.** Every response carries a confidence level, its legal sources, and the fiscal year — the engine never guesses a fact.

> **Hosted remote server, paid per call via [x402](https://x402.org) (USDC on Base).** Capabilities that return a fact are billed from the first call; two discovery tools are free. No account, no API key to store, no personal data — inputs are abstract numbers (income, parts, pension points), never stored.

## Connect

| | |
|---|---|
| **MCP endpoint** (Streamable HTTP / JSON-RPC 2.0) | `https://app.qotien.fr/api/fiscal/v1/mcp` |
| **REST** | `POST https://app.qotien.fr/api/fiscal/v1/calculate` |
| **Manifest** (discovery, tools + pricing) | `GET https://app.qotien.fr/api/fiscal/v1/manifest` |
| **Registry** | `io.github.herve-coulon/tax-retirement` |

Add it to any MCP client that supports a remote Streamable HTTP server, pointing at the endpoint above. Call `qotien_capacites` first (free) for the machine-readable catalog of tools, confidence levels, and prices.

## Why call this instead of computing it yourself

A general LLM (or a code interpreter) *can* do arithmetic, but it does **not** reliably know the current, exact French rules — the 2026 income-tax brackets and décote thresholds, the value of an Agirc-Arrco or CARMF pension point, the reversion rate of each fund, which tax-reduction rates are in force this year. It will produce a confident, wrong number. Qotien is **up to date, sourced, and re-verified against primary sources at every release** — the value where a tax or pension error is unacceptable (fintech, insurtech, advisory tools, wealth-management software).

Two rules the engine never breaks:
- **A figure never travels alone** — every fact comes with its fiscal year, its legal sources, and a confidence level.
- **A calculation, not a guess** — when a rule or input is missing, the tool returns `non_calculable` (an honest refusal), never an invented number and never an "average" rate.

## Tools — 4 domains, 35 tools

MCP tool names are prefixed by domain (`fiscal_*`, `retraite_*`, `simulateurs_*`, `referentiel_*`); the same capabilities are reachable over REST under their bare names (`tmi`, `per_gain`, …). Each tool's tier is shown as `[protocole]` (free) · `[barème]` · `[étude]` · `[optimiseur]` (see Pricing).

### Fiscal (income tax & wealth) — deterministic, `confiance: fiable`
- `fiscal_impot_revenu` `[barème]` — income tax (progressive brackets, family quotient, décote)
- `fiscal_tmi` `[barème]` — marginal tax rate
- `fiscal_cehr` `[barème]` — exceptional contribution on high incomes
- `fiscal_prelevements_sociaux` `[barème]` — social-levy rate by income type (17.2 % vs 18.6 %)
- `fiscal_surtaxe_pv_immobiliere` `[barème]` — real-estate capital-gains surtax
- `fiscal_per_plafond` `[barème]` — PER deduction ceiling (N-1 PASS for employees, N for self-employed)
- `fiscal_plus_value_immobiliere` `[étude]` — real-estate capital gain (holding-period abatements)
- `fiscal_ifi` `[étude]` — real-estate wealth tax (with the 75 % income cap)
- `fiscal_cdhr` `[étude]` — differential contribution on high incomes (20 % floor + décote)
- `fiscal_per_gain` `[étude]` — **tax saved by a PER contribution: the total Δ (brackets + CEHR/CDHR), never "contribution × marginal rate"**
- `fiscal_niches_plafond` `[étude]` — tax-reduction cap (art. 200-0 A) on *reductions*, with the excluded items handled
- `fiscal_flat_tax_vs_bareme` `[étude]` — PFU vs progressive-scale comparison
- `fiscal_jeanbrun` `[étude]` — Jeanbrun rental-investment reduction (art. 31 I-1° i/j CGI)

### Retirement — variable confidence, never a bare figure
- `retraite_ps_pension` `[barème]` (`fiable`) — pension gross→net (CSG/CRDS/CASA + 1 % health on the complementary part)
- `retraite_regimes` `[barème]` (`fiable`) — discovery: the computable schemes (32 covered)
- `retraite_surcote_parentale` `[barème]` (`estime`) — parental surcote (+1.25 %/qtr, max 5 %)
- `retraite_pension_regime` `[étude]` (`fiable`) — pension of one points-based scheme, with a plausibility guard
- `retraite_pension_annuites` `[étude]` (`fiable`) — pension of an annuity-based scheme (public sector, special schemes)
- `retraite_pension_totale` `[étude]` (`fiable`) — consolidated multi-scheme pension (the full career statement in one call), gross→net
- `retraite_estimation` `[étude]` (`estime`/`partiel`/`non_calculable`) — approximate pension from partial data, with a range
- `retraite_rachat` `[étude]` (`fiable`) — trimester buyback (VPLR): cost, net-of-tax, gain, ROI
- `retraite_progressive` `[étude]` (`estime`) — phased retirement (pension fraction + part-time)
- `retraite_optimisation` `[optimiseur]` (`estime`) — ranked menu of end-of-career levers (buyback, parental surcote, phased retirement, optimal age, cumul, SAM, PER) with gain/ROI/confidence

### Simulateurs (wealth projections) — `confiance: estime`
- `simulateurs_girardin` `[barème]` · `simulateurs_rente_viagere` `[barème]`
- `simulateurs_scpi` · `simulateurs_scpi_credit` · `simulateurs_demembrement_scpi` · `simulateurs_apport_credit` · `simulateurs_rentabilite_reelle` · `simulateurs_private_equity` — all `[étude]`

### Référentiel (cite a dated fact) — `confiance: sourcee`
- `referentiel_valeur` `[barème]` — one reference value, with its primary source, legal basis, and verification date
- `referentiel_recherche` `[barème]` — search the reference by domain/keyword
- `referentiel_versions` `[protocole]` — reference version + freshness (free)

### Meta
- `qotien_capacites` `[protocole]` — the catalog of tools, confidence levels, and prices (free; call this first)

## Response contract

```json
{
  "ok": true,
  "domaine": "retraite",
  "capability": "pension_regime",
  "confiance": "fiable",
  "result": { "...": "..." },
  "sources": ["references_officielles.json", "retraite_registre.js", "..."],
  "millesime_fiscal": "2026",
  "avertissement": "Deterministic indicative result — not personalized advice (CIF/DDA)."
}
```
- `confiance`: `fiable` (deterministic, golden-tested) · `estime`/`partiel` (approximation, with a range) · `sourcee` (dated reference fact) · `non_calculable` (honest refusal instead of a made-up number).
- A pension or a tax figure is **never** returned bare — confidence and sources travel with it.

## Pricing — x402

Settlement in **USDC on Base** (`eip155:8453`). Prices are per successful call; a call that fails validation is **not billed** (settlement happens only on delivery).

| Tier | Price | Tools |
|---|---|---|
| `protocole` | **free** | `referentiel_versions`, `qotien_capacites` |
| `barème` | **$0.05** | most `fiscal_*` rate/ceiling tools, `retraite_ps_pension`/`regimes`/`surcote_parentale`, `referentiel_valeur`/`recherche`, `simulateurs_girardin`/`rente_viagere` |
| `étude` | **$0.25** | studies: `per_gain`, `ifi`, `cdhr`, `niches_plafond`, retirement pensions, SCPI/PE simulators… |
| `optimiseur` | **$1.00** | `retraite_optimisation` |

An unpaid call gets **HTTP 402** (x402 v2) on REST **and** MCP. On MCP the body carries both the x402 `accepts` field and a JSON-RPC `-32002` error; a client that cannot pay sees a transport error (the call did not run). **No anonymous free tier** — to evaluate before paying, request a named trial key (header `X-Qotien-Trial`, issued manually). A **euro-denominated commercial licence** exists for application use (classic invoicing) — **contact@qotien.fr**.

## Quick start

```bash
# List tools (free)
curl -s -X POST https://app.qotien.fr/api/fiscal/v1/mcp \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Catalog + prices (free)
curl -s -X POST https://app.qotien.fr/api/fiscal/v1/mcp \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"qotien_capacites","arguments":{}}}'

# A paid call (barème, $0.05) returns HTTP 402 with x402 payment instructions until settled.
# Agirc-Arrco pension: 750.07 points → 1079 €/year (confiance: fiable, sources attached)
curl -s -X POST https://app.qotien.fr/api/fiscal/v1/mcp \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"retraite_pension_regime","arguments":{"code_regime":"agirc_arrco","points":750.07}}}'
```

An x402-capable client (or the `x402-fetch` / `@x402/*` libraries) handles the 402 → sign → settle → retry loop automatically.

## Protocol

MCP `2025-06-18`. Methods: `initialize`, `tools/list`, `tools/call`, `ping`. Transport: JSON-RPC 2.0 over HTTP POST; the endpoint also serves a keepalive SSE stream on GET (`Accept: text/event-stream`) for clients that open the server→client channel. Payment: x402 v2 (EIP-3009 `transferWithAuthorization`, USDC on Base).

## Disclaimer

Results are deterministic indicative computations based on the French tax & social-security reference for the stated fiscal year. They are the raw output of a calculation engine and **do not constitute personalized financial advice** within the meaning of French CIF/DDA regulation.

---
*Part of [Qotien](https://qotien.fr) — the reference for French personal-finance data: aggregated, sourced, dated, re-verified every year. Human-readable ([qotien.fr/sources](https://qotien.fr/sources)) and machine-readable (this MCP). Reference data under CC BY 4.0 — cite “Qotien — qotien.fr”.*
