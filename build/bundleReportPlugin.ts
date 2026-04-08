import fs from "fs";
import path from "path";
import type { Plugin } from "vite";

export function bundleReportPlugin(): Plugin {
  return {
    name: "bundle-report-plugin",
    apply: "build",
    writeBundle(options, bundle) {
      const outputDir = options.dir || path.dirname(options.file || "dist");
      const reportPath = path.resolve(outputDir, "bundle-report.json");
      const report = Object.entries(bundle)
        .map(([fileName, chunk]) => {
          if (chunk.type === "asset") {
            return {
              fileName,
              type: "asset",
              size: typeof chunk.source === "string" ? chunk.source.length : chunk.source.byteLength,
            };
          }

          return {
            fileName,
            type: "chunk",
            size: chunk.code.length,
            imports: chunk.imports,
            dynamicImports: chunk.dynamicImports,
            modules: Object.keys(chunk.modules),
          };
        })
        .sort((left, right) => right.size - left.size);

      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    },
  };
}

