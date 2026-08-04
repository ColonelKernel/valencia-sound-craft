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

