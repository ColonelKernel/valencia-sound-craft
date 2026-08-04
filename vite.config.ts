import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import { bundleReportPlugin } from "./build/bundleReportPlugin";
import { stampRouteHeadsPlugin } from "./build/stampRouteHeadsPlugin";

// TEMPORARY diagnostic: the Netlify UI env vars are not reaching production
// builds (two clean deploys built as if VITE_SUPABASE_* were unset). Emits the
// VITE_ variable *names* (never values) visible to the build into a public
// probe file so the deployed site itself reports what the container saw.
// Remove once the contact-form env delivery is confirmed working.
function buildEnvProbePlugin(): Plugin {
  return {
    name: "build-env-probe",
    apply: "build",
    closeBundle() {
      const payload = {
        viteEnvKeys: Object.keys(process.env)
          .filter((k) => k.startsWith("VITE_"))
          .sort(),
        node: process.version,
        netlify: Boolean(process.env.NETLIFY),
        commit: process.env.COMMIT_REF ?? null,
      };
      fs.writeFileSync(
        path.resolve(__dirname, "dist/build-env-probe.json"),
        JSON.stringify(payload, null, 2),
      );
      console.log("[build-env-probe]", JSON.stringify(payload));
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode === "analyze" && bundleReportPlugin(),
    stampRouteHeadsPlugin(),
    buildEnvProbePlugin(),
  ].filter(Boolean),
  build: {
    manifest: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Rollup's synthetic CommonJS helper module is imported by every
          // chunk that touches a CJS dep; pinned to its own tiny chunk so it
          // never drags a vendor chunk into unrelated routes.
          if (id.includes("commonjsHelpers")) {
            return "cjs-helpers";
          }

          if (!id.includes("node_modules")) {
            return undefined;
          }

          // Pin ONLY the truly app-wide core. Everything else deliberately
          // returns undefined so Rollup co-locates each dependency with its
          // actual consumers — a library used by one lazy route ships with
          // that route, not with the entry. (The old catch-all "vendor"
          // chunk put recharts' lodash, framer-motion's motion-dom, and the
          // jspdf PDF stack on every page.) `npm run budget` enforces the
          // resulting initial-graph size and bans heavy libs from it.
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) {
            return "react-core";
          }

          return undefined;
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
}));
