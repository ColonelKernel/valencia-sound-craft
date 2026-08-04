import fs from "fs";
import path from "path";
import type { Plugin } from "vite";

import { ROUTE_META } from "../src/app/routeMeta";

const SITE_ORIGIN = "https://zachscheffler.com";

/**
 * Emit a per-route copy of the built shell with a correct <head>.
 *
 * The source index.html deliberately carries the HOME route's metadata
 * (routeMeta.test.ts pins that), and RouteHead.tsx maintains the head at
 * runtime — but non-rendering crawlers never execute JS, so before this
 * plugin every deep route served a byte-identical shell with no
 * rel=canonical and og:url pointing at "/" (live-site audit, 2026-07-22).
 *
 * After `vite build`, this writes a flat dist/<path>.html for every real
 * non-home route with the route's title/description, an og:url for the
 * route, and its rel=canonical (replacing the shell's homepage canonical).
 * It also emits dist/404.html — a shell copy with the notFound metadata,
 * no canonical, and a robots noindex. There is deliberately NO SPA
 * wildcard in _redirects: every real route has an explicit rewrite, "/" is
 * served natively, and Netlify answers anything else with 404.html and a
 * real 404 status (the old wildcard soft-404'd unknown URLs as the
 * homepage).
 *
 * RouteHead.tsx upserts (not duplicates) these same tags on hydration, so
 * the stamped values and the hydrated values can never diverge: both read
 * ROUTE_META.
 */
export function stampRouteHeadsPlugin(): Plugin {
  return {
    name: "stamp-route-heads",
    apply: "build",
    closeBundle() {
      const dist = path.resolve(__dirname, "..", "dist");
      const shellPath = path.join(dist, "index.html");

      if (!fs.existsSync(shellPath)) {
        // e.g. a build invoked with a custom outDir; fail loudly rather than
        // silently shipping unstamped routes.
        throw new Error("stamp-route-heads: dist/index.html not found after build");
      }

      const shell = fs.readFileSync(shellPath, "utf8");
      const escapeHtml = (value: string) =>
        value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

      const routes = Object.values(ROUTE_META).filter(
        (route) => route.path !== "/" && route.path !== "*",
      );

      for (const route of routes) {
        const title = escapeHtml(route.title);
        const description = escapeHtml(route.description);
        const url = `${SITE_ORIGIN}${route.path}`;

        let html = shell;
        const replaceOnce = (pattern: RegExp, replacement: string) => {
          if (!pattern.test(html)) {
            throw new Error(`stamp-route-heads: pattern not found for ${route.path}: ${pattern}`);
          }
          html = html.replace(pattern, replacement);
        };

        replaceOnce(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
        replaceOnce(
          /(<meta name="description" content=")[^"]*(">)/,
          `$1${description}$2`,
        );
        replaceOnce(/(<meta property="og:url" content=")[^"]*(" \/>)/, `$1${url}$2`);
        replaceOnce(/(<meta property="og:title" content=")[^"]*(">)/, `$1${title}$2`);
        replaceOnce(/(<meta name="twitter:title" content=")[^"]*(">)/, `$1${title}$2`);
        replaceOnce(
          /(<meta property="og:description" content=")[^"]*(">)/,
          `$1${description}$2`,
        );
        replaceOnce(
          /(<meta name="twitter:description" content=")[^"]*(">)/,
          `$1${description}$2`,
        );
        // Replace, don't append: the shell now carries the homepage canonical.
        replaceOnce(
          /<link rel="canonical" href="[^"]*">/,
          `<link rel="canonical" href="${url}">`,
        );

        // Flat <path>.html, NOT <path>/index.html: a directory with an index
        // triggers Netlify's automatic 301 to the trailing-slash URL before
        // redirect rules run (verified live 2026-07-22), which contradicts the
        // slashless canonical. A flat file creates no directory, so the bare
        // URL serves 200 directly via the rewrite below.
        const outFile = path.join(dist, `${route.path.replace(/^\//, "")}.html`);
        fs.mkdirSync(path.dirname(outFile), { recursive: true });
        fs.writeFileSync(outFile, html);
      }

      // 404 document: Netlify serves dist/404.html with a real 404 status for
      // any path no file or redirect rule matches. Same SPA shell (React
      // mounts and the router renders NotFound), but with honest metadata:
      // notFound title/description, no canonical, no og:url, and noindex so
      // dead inbound links never get indexed as the homepage.
      {
        const nf = ROUTE_META.notFound;
        let html = shell;
        const replaceOnce = (pattern: RegExp, replacement: string) => {
          if (!pattern.test(html)) {
            throw new Error(`stamp-route-heads: pattern not found for 404.html: ${pattern}`);
          }
          html = html.replace(pattern, replacement);
        };
        const title = escapeHtml(nf.title);
        const description = escapeHtml(nf.description);
        replaceOnce(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
        replaceOnce(/(<meta name="description" content=")[^"]*(">)/, `$1${description}$2`);
        replaceOnce(/(<meta property="og:title" content=")[^"]*(">)/, `$1${title}$2`);
        replaceOnce(/(<meta name="twitter:title" content=")[^"]*(">)/, `$1${title}$2`);
        replaceOnce(/(<meta property="og:description" content=")[^"]*(">)/, `$1${description}$2`);
        replaceOnce(/(<meta name="twitter:description" content=")[^"]*(">)/, `$1${description}$2`);
        replaceOnce(/\s*<meta property="og:url" content="[^"]*" \/>/, "");
        replaceOnce(/\s*<link rel="canonical" href="[^"]*">/, "");
        replaceOnce(/<\/head>/, `  <meta name="robots" content="noindex">\n</head>`);
        fs.writeFileSync(path.join(dist, "404.html"), html);
      }

      // Netlify's `/* -> /index.html 200` rewrite shadows the extensionless
      // route URLs: /cv/ and /cv/index.html serve the stamped file, but bare
      // /cv — the canonical form in the sitemap — matched the wildcard first
      // (verified live 2026-07-22). Explicit per-route rewrites placed ABOVE
      // the wildcard win on first-match in both Netlify and Cloudflare Pages.
      const redirectsPath = path.join(dist, "_redirects");
      const baseRedirects = fs.existsSync(redirectsPath)
        ? fs.readFileSync(redirectsPath, "utf8")
        : "";
      const routeRewrites = routes
        .map(
          (route) =>
            // Both the bare URL and its trailing-slash variant serve the
            // stamped shell — links in the wild use either form.
            `${route.path}    ${route.path}.html    200\n${route.path}/    ${route.path}.html    200`,
        )
        .join("\n");
      fs.writeFileSync(
        redirectsPath,
        `# Generated by stamp-route-heads: serve each route's stamped shell at\n# its extensionless URL, ahead of the SPA wildcard below.\n${routeRewrites}\n\n${baseRedirects}`,
      );

      // Stamped shells reference fingerprinted assets exactly like the root
      // shell, so they must revalidate on every request too.
      const headersPath = path.join(dist, "_headers");
      const existing = fs.existsSync(headersPath) ? fs.readFileSync(headersPath, "utf8") : "";
      const stanzas = routes
        .map((route) => `${route.path}\n  Cache-Control: public, max-age=0, must-revalidate`)
        .join("\n\n");
      fs.writeFileSync(
        headersPath,
        `${existing.trimEnd()}\n\n# Generated by stamp-route-heads: per-route shells revalidate like the root shell.\n${stanzas}\n`,
      );

      this.info(`stamped ${routes.length} route heads`);
    },
  };
}
