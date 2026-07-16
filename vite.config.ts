import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { bundleReportPlugin } from "./build/bundleReportPlugin";

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
  ].filter(Boolean),
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Rollup's synthetic CommonJS helper module is imported by every
          // chunk that touches a CJS dep. Left unassigned it gets merged
          // into whichever vendor chunk uses it most (historically
          // map-vendor), forcing leaflet onto every route. Pin it to its
          // own tiny chunk instead.
          if (id.includes("commonjsHelpers")) {
            return "cjs-helpers";
          }

          if (!id.includes("node_modules")) {
            return undefined;
          }

          // react-leaflet must live with leaflet: if it lands in the shared
          // "vendor" chunk, vendor (and therefore the entry) statically
          // depends on map-vendor and the map stack loads on every route.
          if (id.includes("leaflet")) {
            return "map-vendor";
          }

          if (id.includes("abcjs")) {
            return "notation-vendor";
          }

          if (id.includes("react-router-dom") || id.includes("@tanstack/react-query")) {
            return "app-vendor";
          }

          if (id.includes("lucide-react")) {
            return "ui-vendor";
          }

          if (
            id.includes("recharts") ||
            id.includes("victory-vendor") ||
            id.includes("d3-") ||
            id.includes("internmap") ||
            id.includes("delaunator")
          ) {
            return "charts-vendor";
          }

          if (id.includes("framer-motion")) {
            return "motion-vendor";
          }

          if (id.includes("@supabase")) {
            return "supabase-vendor";
          }

          if (id.includes("node_modules/zod/")) {
            return "forms-vendor";
          }

          return "vendor";
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
