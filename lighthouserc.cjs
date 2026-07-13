module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      url: ["http://127.0.0.1:4173/"],
      startServerCommand: "npm run preview -- --host 127.0.0.1 --port 4173",
      startServerReadyPattern: "Local:",
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.95 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["error", { minScore: 0.95 }],
        "categories:seo": ["error", { minScore: 0.95 }],
        "total-byte-weight": ["error", { maxNumericValue: 1572864 }],
        "resource-summary:script:size": ["error", { maxNumericValue: 204800 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "first-contentful-paint": ["error", { maxNumericValue: 1800 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci/reports",
    },
  },
};
