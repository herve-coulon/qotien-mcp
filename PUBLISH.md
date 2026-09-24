# How to publish this repo and list the MCP

> This folder is the **ready-to-push content** of a public GitHub repo `qotien-mcp`. It contains
> only a description of a *hosted* MCP endpoint (no server code, no secrets). The endpoint is
> **paid per call via x402** (USDC on Base); two discovery tools are free. Everything below is
> an **outward action** (your GitHub / accounts) — the technical side (endpoint, SSE, x402, sitemap) is done.

## 1. Create and push the public repo

```bash
# From an empty folder containing README.md, server.json, smithery.yaml, LICENSE:
git init && git add . && git commit -m "Qotien — French Tax & Retirement MCP"
# Create a PUBLIC repo named qotien-mcp on GitHub (under your account or a Qotien org), then:
git remote add origin https://github.com/<OWNER>/qotien-mcp.git
git branch -M main && git push -u origin main
```

Then in `server.json`, replace `OWNER` in `repository.url` with the real owner.

## 2. Choose the registry namespace (in `server.json` → `name`)

The official MCP registry requires you to **prove you own the namespace**:
- **`io.github.<OWNER>/qotien-mcp`** — verified via GitHub OAuth. **Simplest, recommended to start.**
- **`fr.qotien/tax-retirement`** — verified via a DNS TXT record on `qotien.fr`. Nicer/branded, a bit more setup.

Set `name` accordingly before submitting.

## 3. Submit to registries

- **Official MCP Registry** (`registry.modelcontextprotocol.io`): use the publisher CLI with `server.json` (it authenticates the namespace via GitHub or DNS). This is the canonical listing many clients read.
- **Smithery** (`smithery.ai`): the reliable path for an already-hosted remote server is the web UI — **Add Server → paste `https://app.qotien.fr/api/fiscal/v1/mcp`**. `smithery.yaml` is included as the declarative equivalent (verify its schema at smithery.ai/docs).
- **mcp.so · Glama · PulseMCP**: community directories — submit the repo URL or the endpoint via their forms; several also crawl public GitHub repos, so step 1 helps here too.

## 3bis. Keep the listing in sync

- **`server.json` here must stay byte-identical to `docs/mcp/server.json` in the main Qotien repo** — that file is the one `mcp-publisher` publishes. Bump the version there, publish, then copy it here (drift seen on 24/09: registry 0.1.2, private copy 0.1.1, this repo 0.1.0).
- **`glama.json`** declares the Glama maintainer (`maintainers` is the only field of Glama's schema).
- **CI** (`.github/workflows/check.yml` → `scripts/check-endpoint.mjs`) checks this metadata and the live endpoint on every push and daily. It also fails if the README's tool count no longer matches `tools/list` — update the README when tools are added.

## 4. Before you distribute widely — write the kill/continue

Fix a verifiable threshold so you don't read noise as signal, e.g.:
> « ≥ 5 distinct non-bot agents calling `tools/call` (not just `manifest`) within 4 weeks of listing → continue (auth + quotas + billing); otherwise freeze and reassess. »

Usage is measured server-side in `agent_probe_log` (metadata only — transport, capability, ok, hashed IP, user-agent). No calc inputs are stored.

---
For the full picture (both revenue voies, the Voie B / Google Search Console step, the strategy), see `docs/mcp/DISTRIBUTION.md` in the main Qotien repo.
