import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { Plugin } from "vite";

// Relative import, not "@/": this module is loaded through the Vite config
// chain, where the alias does not resolve.
import { CV_PDF_FILENAME, drawCvPdf } from "../src/content/cvPdf";

/**
 * Emits the CV as a static file at dist/Zach-Scheffler-CV.pdf.
 *
 * Why a build step rather than a committed binary: applications need a stable,
 * crawlable URL to link, but a checked-in PDF silently rots the moment anyone
 * edits src/content/cv.ts. Generating it from the same drawCvPdf() the download
 * button uses makes drift impossible — if the CV changes, so does the file.
 *
 * jsPDF ships a dedicated Node build (selected by the "node" export condition)
 * that needs no DOM shim. Note that its save() under Node writes to
 * process.cwd() rather than throwing, which would leave a stray PDF at the repo
 * root and nothing in dist — so this uses output("arraybuffer") and writes the
 * file itself.
 */
export function emitCvPdfPlugin(): Plugin {
  let outDir = "dist";

  return {
    name: "emit-cv-pdf",
    apply: "build",

    configResolved(config) {
      outDir = config.build.outDir;
    },

    async closeBundle() {
      const { jsPDF } = await import("jspdf");
      const doc = drawCvPdf(new jsPDF());
      const bytes = new Uint8Array(doc.output("arraybuffer") as ArrayBuffer);

      if (bytes.length === 0) {
        throw new Error("emit-cv-pdf: jsPDF produced an empty document");
      }

      const target = join(outDir, CV_PDF_FILENAME);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, bytes);

      console.log(
        `[plugin emit-cv-pdf] wrote ${CV_PDF_FILENAME} (${(bytes.length / 1024).toFixed(1)} KB)`,
      );
    },
  };
}
