module.exports = {
  ci: {
    collect: {
      numberOfRuns: 1,
      url: [
        "http://127.0.0.1:4173/",
        "http://127.0.0.1:4173/tools",
        "http://127.0.0.1:4173/tools/rhythm",
        "http://127.0.0.1:4173/tools/harmony",
        "http://127.0.0.1:4173/cv",
        "http://127.0.0.1:4173/projects",
        "http://127.0.0.1:4173/projects/autoharm",
        "http://127.0.0.1:4173/projects/catalog-intelligence",
        "http://127.0.0.1:4173/projects/transit-atlas",
        "http://127.0.0.1:4173/projects/session-state",
        "http://127.0.0.1:4173/music-analytics",
        // The six routes this file used to omit were the six heaviest:
        // /music-analytics (recharts, listed above), /tools/map and
        // /groove-atlas (leaflet and the canvas feel-space lens), /work (embed
        // facades), and the two remaining harmony tools. An accessibility floor
        // of 1.0 applied only to the routes least likely to break it is not a
        // floor. All sixteen real routes are audited now.
        "http://127.0.0.1:4173/tools/map",
        "http://127.0.0.1:4173/tools/circle",
        "http://127.0.0.1:4173/tools/tonnetz",
        "http://127.0.0.1:4173/groove-atlas",
        "http://127.0.0.1:4173/work",
      ],
      startServerCommand: "npm run preview -- --host 127.0.0.1 --port 4173",
      startServerReadyPattern: "Local:",
    },
    assert: {
      assertions: {
        "categories:seo": ["error", { minScore: 0.95 }],
        // Every audited route scores 100 after the 2026-08 pass (step-grid
        // gap + muted-foreground contrast lift). Hold the line at a perfect
        // score so any regression fails the build.
        "categories:accessibility": ["error", { minScore: 1.0 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "categories:performance": ["warn", { minScore: 0.8 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 3000 }],
        "first-contentful-paint": ["warn", { maxNumericValue: 2200 }],
      },
    },
    upload: {
      target: "filesystem", outputDir: ".lighthouseci",
    },
  },
};

