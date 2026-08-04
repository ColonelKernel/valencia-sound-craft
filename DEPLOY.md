# Deploying the portfolio (zachscheffler.com)

Runbook for moving the portfolio off Lovable onto a static host.

## Why we moved

`ColonelKernel/valencia-sound-craft` was originally created by Lovable — its
bot (`gpt-engineer-app[bot]`) authored much of the early history, and the
Lovable project two-way-syncs the **`main`** branch.

`main` was later slimmed into the **research dossier**
(`package.json` name: `zach-scheffler-research-dossier`). So Lovable's project
now holds the dossier, and the live site is still the old portfolio *only*
because nobody has pressed Publish since that change.

**Pressing Publish in Lovable would put the dossier on zachscheffler.com.**

The root problem: `main` can be the dossier *or* the Lovable-fed portfolio
source — not both. Decoupling the portfolio onto its own host resolves it
permanently and stops Lovable's bot from writing to `main`.

- Portfolio source of truth: branch **`portfolio/rebuild`**
- Dossier: stays on `main`, deploys separately (→ research.zachscheffler.com)

## Host setup (Netlify)

Netlify is recommended over Cloudflare Pages **because DNS is at Google
Domains**: Netlify publishes an apex `A` record, so the domain stays put.
Cloudflare Pages only offers a CNAME target, which needs nameservers moved to
Cloudflare to work at an apex.

Add new site → Import an existing project → GitHub → `ColonelKernel/valencia-sound-craft`
(private repo — grant access).

| Setting | Value |
| --- | --- |
| **Production branch** | **`portfolio/rebuild`** ⚠️ **not `main`** (`main` is the dossier) |
| Build command | `npm run build` |
| Publish directory | `dist` |
| `NODE_VERSION` | `20` (only if the build fails on Node version) |

**Environment variables ARE required.** `.env` is untracked (gitignored), so
the build only sees what the host provides. Set both in Netlify → Site
configuration → Environment variables (scope: All; they are public values,
shipped verbatim in the JS bundle):

- `VITE_SUPABASE_URL` = `https://uqcjivqzilisngdwtdzl.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_k8udo0mt3Rem4VtHagQpsg_rHG6s1qV`

Without them the contact form compiles out and the site ships a "reach out
directly" panel instead (see `BACKEND_CONFIGURED` in
`src/components/Contact.tsx`). Set 2026-08-03 and verified inlined in the live
bundle — but note that only proves the build side; an end-to-end submission
requires the Supabase project to be running (it was found paused, likely since
~2026-07-29). After restoring, verify a real submission lands in
`contact_messages` before trusting the form.

**Free-tier pause:** Supabase pauses free projects after ~7 days without API
activity, which breaks the form until someone restores the project in the
dashboard. `.github/workflows/supabase-keepalive.yml` pings the REST endpoint
every 3 days to prevent this — the copy on `main` (the default branch) is the
one GitHub actually schedules.

Static-host config already lives in the repo:

- `public/_redirects` — the legacy `/groove-intelligence` 301. Per-route
  rewrites are generated into `dist/_redirects` at build time by
  `build/stampRouteHeadsPlugin.ts`; there is deliberately no `/*` SPA
  catch-all — unknown paths get the generated `dist/404.html` with a real
  404 status.
- `public/_headers` — HSTS, `nosniff`, referrer-policy (parity with the old
  Lovable responses), immutable caching for fingerprinted `/assets`, and
  no-cache on `index.html`.

## Verify BEFORE touching DNS

Run against the `*.netlify.app` URL while the live domain still serves the old
site. Do not proceed until all pass:

- [ ] `/` renders; hero, services, portfolio, analytics preview, contact
- [ ] Deep links load directly (not via in-app nav): `/tools/rhythm`,
      `/tools/harmony`, `/tools/circle`, `/tools/tonnetz`, `/tools/map`,
      `/music-analytics`, `/groove-intelligence` — proves `_redirects` works
- [ ] An unknown path (`/nope`) returns HTTP 404 and renders the in-app
      404 page (served from the generated `404.html` shell)
- [ ] Zero console errors on every route
- [ ] `/groove-intelligence` loads and a groove can be selected without the tab
      freezing (regression guard for the old `generatePattern` infinite loop)
- [ ] Audio: transport plays; switching tools doesn't leave audio running
- [ ] Contact form submits and the row lands in Supabase (see caveat below)
- [ ] `curl -sI` shows the `_headers` values

## DNS cutover (Google Domains)

Only after the checklist above is green.

1. Record the current values first (rollback): apex `A` → `185.158.133.1`.
2. Replace the apex `A` record with the value Netlify shows under
   Domains → Add custom domain (use Netlify's displayed record, not a
   remembered IP).
3. Point `www` at the Netlify target per their instructions.
4. Wait for propagation, then confirm:
   `curl -sI https://zachscheffler.com/` no longer reports Lovable's
   `x-deployment-id`, and `dig +short zachscheffler.com` no longer returns
   `185.158.133.1`.
5. Confirm HTTPS: Netlify must issue a cert for the apex + `www`.

**Rollback:** restore the apex `A` record to `185.158.133.1`. The Lovable
deployment is left untouched throughout, so it keeps serving until DNS moves —
zero downtime, instant revert.

## Post-cutover cleanup

- [x] **Contact form / Supabase.** DONE 2026-08-03: repointed to the user's own
      project `uqcjivqzilisngdwtdzl` (option b) via the two Netlify env vars
      above. The `contact_messages` table + anon-insert RLS live there, and the
      `groove-narrative` / `lastfm-artist` edge functions were redeployed to it.
      Caveat: local `.env` may still point at the retired Lovable project
      `xvdskahnddnlvsfypcci` — update it by hand for correct local submits.
- [x] **Untrack `.env`** — done (`5eb23d4`); `.gitignore` covers it and Netlify
      carries the two `VITE_…` vars.
- [ ] **Rotate the Supabase anon key** once the contact form is verified.
- [ ] **Retire Lovable** — once DNS is moved and stable, the Lovable project no
      longer serves anything. Leave it alone or disconnect its GitHub sync so
      its bot can't write to `main`.
- [ ] Point the dossier at `research.zachscheffler.com` (separate host + DNS).
