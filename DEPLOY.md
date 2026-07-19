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

**Environment variables are NOT required.** `.env` is currently committed to the
repo, so Vite picks up `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
at build time. (See *Post-cutover cleanup* — this should not stay true.)

Static-host config already lives in the repo:

- `public/_redirects` — SPA fallback (`/* /index.html 200`). Without it every
  deep link (`/tools/rhythm`, `/music-analytics`, …) hard-404s.
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
- [ ] An unknown path (`/nope`) renders the in-app 404, not a host 404
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

- [ ] **Contact form / Supabase.** The build targets project
      `xvdskahnddnlvsfypcci` (Lovable-managed, not in the user's own Supabase
      account). The `contact_messages` table + anon-insert RLS were created on
      the user's *own* project `uqcjivqzilisngdwtdzl`. Decide one:
      (a) get access to `xvdskahnddnlvsfypcci` and run the migration there, or
      (b) repoint `VITE_SUPABASE_URL`/key to `uqcjivqzilisngdwtdzl` — but note
      analytics data and the `catalog-analyzer` edge function would also need
      migrating. **Verify a real submission lands somewhere before trusting it.**
- [ ] **Untrack `.env`** (`git rm --cached .env`, add an ignore rule) and set
      the two `VITE_…` vars in Netlify instead. Do this *after* the site is
      confirmed live, since it changes how the build gets its config.
- [ ] **Rotate the Supabase anon key** once the contact form is verified.
- [ ] **Retire Lovable** — once DNS is moved and stable, the Lovable project no
      longer serves anything. Leave it alone or disconnect its GitHub sync so
      its bot can't write to `main`.
- [ ] Point the dossier at `research.zachscheffler.com` (separate host + DNS).
