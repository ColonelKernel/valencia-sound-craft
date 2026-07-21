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
        // Every audited route currently scores 93–100. The floor is 0.90 so a
        // real regression fails the build; the gap to 100 on /tools/rhythm is
        // target-size on the dense step grid and low-contrast .opacity-60
        // text, both deliberate design choices rather than oversights.
        "categories:accessibility": ["error", { minScore: 0.9 }],
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

