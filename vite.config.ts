import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { bundleReportPlugin } from "./build/bundleReportPlugin";
import { stampRouteHeadsPlugin } from "./build/stampRouteHeadsPlugin";

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
    mode === "analyze" && bundleReportPlugin(),
    stampRouteHeadsPlugin(),
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
