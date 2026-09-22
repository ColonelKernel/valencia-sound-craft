#!/usr/bin/env node
/**
 * Verifies that the publishable key this repo ships is actually registered to
 * the Supabase project, and that the project is awake.
 *
 * build/deployConfig.test.ts holds DEPLOY.md and both workflows to one key
 * string, but agreement is not liveness: for an unknown stretch DEPLOY.md
 * carried `sb_publishable_k8udo0mt3Rem4VtHagQpsg_rHG6s1qV`, which is not
 * registered to this project at all and returns 401. A consistent, revoked key
 * fails silently — the contact form compiles down to its "reach out directly"
 * fallback and nothing reports it.
 *
 * Read-only, and the key is public: it ships verbatim in the client bundle,
 * so this makes exactly the request any visitor's browser already makes.
 *
 *   node scripts/check-supabase-key.mjs
 *
 * Exit codes: 0 key valid and project serving · 1 key rejected or project
 * unreachable. Safe to wire into CI, but note it will fail while the project
 * is paused, which is a real outage rather than a config error.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ci = readFileSync(join(root, ".github", "workflows", "ci.yml"), "utf8");

const url = ci.match(/https:\/\/[a-z0-9]+\.supabase\.co/)?.[0];
const key = ci.match(/sb_publishable_[A-Za-z0-9_-]+/)?.[0];

if (!url || !key) {
  console.error("Could not read VITE_SUPABASE_* out of .github/workflows/ci.yml.");
  process.exit(1);
}

const masked = `${key.slice(0, 24)}…`;
console.log(`project: ${url}`);
console.log(`key:     ${masked}`);

let response;
try {
  response = await fetch(`${url}/rest/v1/contact_messages?select=id&limit=1`, {
    headers: { apikey: key },
    signal: AbortSignal.timeout(30_000),
  });
} catch (error) {
  // No HTTP response at all is the paused-project signature: the hostname
  // stops resolving rather than returning an error page.
  console.error(`\nFAIL  no HTTP response (${error.message}).`);
  console.error("      Project is unreachable — most likely paused. Restore it in the");
  console.error("      Supabase dashboard, then re-run.");
  process.exit(1);
}

const status = response.status;

if (status === 401 || status === 403) {
  // Distinguish a revoked key from row-level security denying the read: RLS
  // returns a permission error, an unregistered key says so by name.
  const body = await response.text();
  if (/unregistered|invalid api key/i.test(body)) {
    console.error(`\nFAIL  HTTP ${status} — this key is not registered to the project.`);
    console.error("      Update ci.yml, supabase-keepalive.yml and DEPLOY.md together;");
    console.error("      build/deployConfig.test.ts will hold them in step.");
    process.exit(1);
  }
  // RLS denial still proves the key is real and the project is serving.
  console.log(`\nOK    HTTP ${status} — key accepted, read denied by row-level security.`);
  process.exit(0);
}

if (status >= 500) {
  console.error(`\nFAIL  HTTP ${status} — gateway error, project appears paused or broken.`);
  process.exit(1);
}

console.log(`\nOK    HTTP ${status} — key valid and project serving.`);
