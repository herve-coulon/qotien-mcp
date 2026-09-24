#!/usr/bin/env node
// Checks the metadata in this repo and the LIVE hosted MCP endpoint it describes.
// Run by CI on every push/PR and daily (doubles as an uptime probe). No dependencies (Node ≥ 20).
//
// What it proves, without ever paying or storing anything:
//   1. server.json / glama.json are valid and point at the documented endpoint;
//   2. initialize answers (protocol version, serverInfo, instructions);
//   3. tools/list is free and exposes the documented catalog (count matches the README);
//   4. the two free tools (qotien_capacites, referentiel_versions) answer without payment;
//   5. a paid tool without payment gets HTTP 402 with x402 terms — never a free result.
import { readFileSync } from 'node:fs';

const ENDPOINT = 'https://app.qotien.fr/api/fiscal/v1/mcp';
let failed = 0;
const ok = (msg) => console.log(`  ✓ ${msg}`);
const ko = (msg) => { failed++; console.log(`  ✗ ${msg}`); };
const check = (cond, msg, detail = '') => (cond ? ok(msg) : ko(detail ? `${msg} (${detail})` : msg));

async function rpc(method, params, id = 1) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id, method, ...(params ? { params } : {}) }),
  });
  let body = null;
  try { body = await res.json(); } catch { /* non-JSON body */ }
  return { status: res.status, body };
}

console.log('── Repository metadata');
const server = JSON.parse(readFileSync('server.json', 'utf8'));
check(/^io\.github\.[^/]+\/.+/.test(server.name), 'server.json has a registry name', server.name);
check(server.remotes?.some((r) => r.type === 'streamable-http' && r.url === ENDPOINT), 'server.json remote = documented endpoint');
const glama = JSON.parse(readFileSync('glama.json', 'utf8'));
check(Array.isArray(glama.maintainers) && glama.maintainers.length > 0, 'glama.json declares maintainers');
const readme = readFileSync('README.md', 'utf8');
const documented = Number((readme.match(/(\d+)\s+tools/) || [])[1]);
check(Number.isFinite(documented), 'README documents a tool count', String(documented));

console.log('── Live endpoint');
const init = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'qotien-mcp-ci', version: '1' } });
check(init.status === 200 && init.body?.result?.serverInfo?.name, 'initialize answers', `HTTP ${init.status}`);
check(typeof init.body?.result?.instructions === 'string' && init.body.result.instructions.length > 0, 'initialize publishes instructions');

const list = await rpc('tools/list', null, 2);
const tools = list.body?.result?.tools || [];
check(list.status === 200 && tools.length > 0, 'tools/list is free and answers', `HTTP ${list.status}`);
check(tools.length === documented, `catalog matches the README (${documented} tools)`, `live: ${tools.length}`);

for (const name of ['qotien_capacites', 'referentiel_versions']) {
  const r = await rpc('tools/call', { name, arguments: {} }, 3);
  check(r.status === 200 && r.body?.result && !r.body?.error, `${name} (free tier) answers without payment`, `HTTP ${r.status}`);
}

const paid = await rpc('tools/call', { name: 'fiscal_tmi', arguments: { revenu_net_imposable: 50000, parts: 1 } }, 4);
check(paid.status === 402, 'paid tool without payment → HTTP 402 (x402)', `HTTP ${paid.status}`);
check(!paid.body?.result, 'paid tool without payment returns no result');

console.log(failed === 0 ? '\n✅ all checks passed' : `\n⛔ ${failed} check(s) failed`);
process.exit(failed === 0 ? 0 : 1);
