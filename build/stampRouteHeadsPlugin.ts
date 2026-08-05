import fs from "fs";
import path from "path";
import type { Plugin } from "vite";

import { ROUTE_META } from "../src/app/routeMeta";
import { ROUTE_JSONLD } from "../src/app/routeStructuredData";
import { serializeJsonLd } from "./jsonld";

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

      let shell = fs.readFileSync(shellPath, "utf8");

      // ---- Non-blocking main stylesheet ---------------------------------
      // The body is just <div id="root"> — nothing can paint before React
      // mounts, and the CSS (still preloaded from the head) always lands
      // before the far larger JS graph finishes executing. Moving the
      // blocking <link> to body-end removes ~300ms of render-blocking from
      // every route with zero inline JS (the classic preload-onload swap
      // would need an inline handler the CSP forbids). The tiny inline style
      // covers the residual race with the correct background/colors — keep
      // it in sync with the :root tokens in src/index.css.
      const cssLinkMatch = shell.match(
        /<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+\.css)">/,
      );
      if (!cssLinkMatch) {
        throw new Error("stamp-route-heads: entry stylesheet link not found in shell");
      }
      const cssHref = cssLinkMatch[1];
      const criticalStyle =
        '<style>:root{color-scheme:dark}body{margin:0;background:#121212;color:#ebebeb;font-family:"DM Sans",system-ui,sans-serif}</style>';
      shell = shell.replace(
        cssLinkMatch[0],
        `${criticalStyle}\n    <link rel="preload" as="style" crossorigin href="${cssHref}">`,
      );
      if (!/<\/body>/.test(shell)) {
        throw new Error("stamp-route-heads: </body> not found in shell");
      }
      shell = shell.replace(
        /<\/body>/,
        `  <link rel="stylesheet" crossorigin href="${cssHref}">\n</body>`,
      );
      const escapeHtml = (value: string) =>
        value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

      // ---- Per-route modulepreload sets from the Vite manifest ----
      // Route chunks are dynamic imports, so the browser only discovers them
      // after the entry executes — one full RTT late. Preloading each route's
      // chunk closure from its stamped shell collapses that wave.
      const manifestPath = path.join(dist, ".vite", "manifest.json");
      if (!fs.existsSync(manifestPath)) {
        throw new Error(
          "stamp-route-heads: dist/.vite/manifest.json not found — build.manifest must stay enabled",
        );
      }
      type ManifestChunk = { file: string; imports?: string[] };
      const manifest: Record<string, ManifestChunk & { dynamicImports?: string[] }> =
        JSON.parse(fs.readFileSync(manifestPath, "utf8"));

      const collectFiles = (key: string, seen: Set<string>, out: Set<string>) => {
        if (seen.has(key)) return;
        seen.add(key);
        const chunk = manifest[key];
        if (!chunk) {
          throw new Error(`stamp-route-heads: manifest key missing: ${key}`);
        }
        out.add(chunk.file);
        for (const imp of chunk.imports ?? []) {
          collectFiles(imp, seen, out);
        }
      };

      // The entry graph is already modulepreload-ed by Vite in the shell.
      const entryFiles = new Set<string>();
      collectFiles("index.html", new Set(), entryFiles);

      // Manifest keys for route chunks are NOT uniformly source paths (Rollup
      // drops some facades, e.g. harmony becomes "_Tool-<hash>.js"), so the
      // mapping zips ROUTE_META's authored key order with the entry's
      // dynamicImports order — which mirrors the PAGES literal in App.tsx.
      // The prefix check turns any drift into a loud build failure instead of
      // silently preloading the wrong route's chunks.
      const EXPECTED_CHUNK_PREFIX: Record<string, string> = {
        home: "Index-",
        toolsIndex: "ToolsIndex-",
        rhythm: "Tool-",
        harmony: "Tool-",
        map: "Tool-",
        circle: "Tool-",
        tonnetz: "Tool-",
        musicAnalytics: "MusicAnalyticsPage-",
        grooveAtlas: "GrooveAtlasPage-",
        projects: "ProjectsPage-",
        work: "WorkPage-",
        cv: "CVPage-",
        notFound: "NotFound-",
      };
      const routeKeysInOrder = Object.keys(ROUTE_META);
      const dynamicKeys = manifest["index.html"].dynamicImports ?? [];
      if (dynamicKeys.length !== routeKeysInOrder.length) {
        throw new Error(
          `stamp-route-heads: ${routeKeysInOrder.length} ROUTE_META routes but ${dynamicKeys.length} entry dynamic imports — PAGES in App.tsx and ROUTE_META have drifted`,
        );
      }
      const modulePreloadsByKey = new Map<string, string>();
      routeKeysInOrder.forEach((routeKey, index) => {
        const chunk = manifest[dynamicKeys[index]];
        const prefix = EXPECTED_CHUNK_PREFIX[routeKey];
        if (!prefix || !path.basename(chunk.file).startsWith(prefix)) {
          throw new Error(
            `stamp-route-heads: route "${routeKey}" mapped to chunk ${chunk.file} (expected basename prefix "${prefix}") — keep PAGES in App.tsx in ROUTE_META order`,
          );
        }
        const files = new Set<string>();
        collectFiles(dynamicKeys[index], new Set(), files);
        const links = [...files]
          .filter((file) => !entryFiles.has(file))
          .map((file) => `  <link rel="modulepreload" crossorigin href="/${file}">`)
          .join("\n");
        modulePreloadsByKey.set(routeKey, links);
      });

      const routeEntries = Object.entries(ROUTE_META).filter(
        ([, route]) => route.path !== "/" && route.path !== "*",
      ) as Array<[keyof typeof ROUTE_META, (typeof ROUTE_META)[keyof typeof ROUTE_META]]>;
      const routes = routeEntries.map(([, route]) => route);

      for (const [routeKey, route] of routeEntries) {
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
        // The shared og-image is fine; its alt describing the homepage photo
        // is not — describe the route instead.
        replaceOnce(
          /(<meta property="og:image:alt" content=")[^"]*(" \/>)/,
          `$1${title}$2`,
        );
        // The hero image only renders on "/" — preloading its 113 KB with
        // fetchpriority=high on every other route just competes with that
        // route's real critical path.
        replaceOnce(/\s*<link rel="preload" as="image" href="\/hero-photo\.webp"[^>]*>/, "");

        // Structured data, statically visible to crawlers that never run JS.
        // The id is load-bearing: RouteHead removes #route-jsonld on
        // hydration before inserting its own copy of the SAME payload
        // (both read ROUTE_JSONLD), so stamped and hydrated never diverge.
        const jsonLd = ROUTE_JSONLD[routeKey];
        if (jsonLd) {
          replaceOnce(
            /<\/head>/,
            `  <script type="application/ld+json" id="route-jsonld">${serializeJsonLd(jsonLd, url)}</script>\n</head>`,
          );
        }

        const preloads = modulePreloadsByKey.get(routeKey);
        if (preloads) {
          replaceOnce(/<\/head>/, `${preloads}\n</head>`);
        }

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
        replaceOnce(/\s*<link rel="preload" as="image" href="\/hero-photo\.webp"[^>]*>/, "");
        replaceOnce(/<\/head>/, `  <meta name="robots" content="noindex">\n</head>`);
        const nfPreloads = modulePreloadsByKey.get("notFound");
        if (nfPreloads) {
          replaceOnce(/<\/head>/, `${nfPreloads}\n</head>`);
        }
        fs.writeFileSync(path.join(dist, "404.html"), html);
      }

      // Home shell: the loop above skips "/", but the homepage still needs
      // its Person JSON-LD statically. Rewrite dist/index.html LAST so the
      // per-route stamps above always start from the pristine shell.
      {
        const homeJsonLd = ROUTE_JSONLD.home;
        if (!homeJsonLd) {
          throw new Error("stamp-route-heads: ROUTE_JSONLD is missing the home entry");
        }
        if (!/<\/head>/.test(shell)) {
          throw new Error("stamp-route-heads: </head> not found in shell for home JSON-LD");
        }
        const homePreloads = modulePreloadsByKey.get("home") ?? "";
        const homeHtml = shell.replace(
          /<\/head>/,
          `  <script type="application/ld+json" id="route-jsonld">${serializeJsonLd(homeJsonLd, `${SITE_ORIGIN}/`)}</script>\n${homePreloads}\n</head>`,
        );
        fs.writeFileSync(shellPath, homeHtml);
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
