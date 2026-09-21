/**
 * CV PDF layout — the single drawing routine behind both copies of the résumé.
 *
 * One caller draws the document: build/emitCvPdfPlugin.ts, which runs this
 * under Node at build time and writes dist/Zach-Scheffler-CV.pdf — a stable,
 * crawlable URL to put on applications. /cv links that file directly.
 *
 * It used to have a second caller: CVPage.tsx dynamic-imported jspdf to redraw
 * the same document in the browser. That shipped ~241 KB gzip of jsPDF,
 * html2canvas and purify to reproduce a file the build already emits, so the
 * download button now points at the artifact. src/content/cvPdf.test.ts is the
 * remaining non-build caller, and it is what keeps this in step with cv.ts.
 *
 * CONSTRAINTS, both load-bearing:
 *   - Relative imports only. The build plugin enters the Vite config load
 *     chain, where the "@/" alias does not resolve.
 *   - No DOM. tsconfig.node.json compiles this with lib ES2023 and no DOM
 *     types, so anything touching window/document fails typecheck.
 */

import {
  CAREER_TIMELINE,
  CV_PDF_FILENAME,
  CV_PROFILE,
  EDUCATION,
  EXPERIENCE,
  METHODS,
  SKILLS,
} from "./cv";

export { CV_PDF_FILENAME };

export interface CvPdfLink {
  label: string;
  url: string;
}

/** Contact and profile links, in the order a hiring reader wants them. */
export const CV_PDF_LINKS: CvPdfLink[] = [
  { label: "Email", url: `mailto:${CV_PROFILE.email}` },
  { label: "Portfolio", url: CV_PROFILE.site },
  { label: "GitHub", url: CV_PROFILE.profiles.github },
  { label: "Research", url: CV_PROFILE.research },
  { label: "LinkedIn", url: CV_PROFILE.profiles.linkedin },
  { label: "Spotify", url: CV_PROFILE.profiles.spotify },
  { label: "SoundCloud", url: CV_PROFILE.profiles.soundcloud },
  { label: "YouTube", url: CV_PROFILE.profiles.youtube },
];

/**
 * The subset of jsPDF this layout uses. Declared structurally so the module
 * never has to import jspdf's types — the browser caller and the Node build
 * plugin each bring their own instance.
 */
export interface CvPdfDoc {
  setFontSize(size: number): unknown;
  setTextColor(gray: number): unknown;
  setDrawColor(gray: number): unknown;
  text(text: string, x: number, y: number): unknown;
  line(x1: number, y1: number, x2: number, y2: number): unknown;
  splitTextToSize(text: string, size: number): string[];
  addPage(): unknown;
}

/** Draws the full CV onto `doc`. Returns the same doc for chaining. */
export function drawCvPdf<T extends CvPdfDoc>(doc: T): T {
  const margin = 14;
  const width = 210 - margin * 2;
  let y = 22;

  const ensureSpace = (needed: number) => {
    if (y + needed > 280) {
      doc.addPage();
      y = 22;
    }
  };

  const sectionHeading = (label: string) => {
    ensureSpace(16);
    y += 4;
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(label.toUpperCase(), margin, y);
    y += 2;
    doc.setDrawColor(210);
    doc.line(margin, y, margin + width, y);
    y += 6;
  };

  // Header
  doc.setFontSize(22);
  doc.setTextColor(20);
  doc.text(CV_PROFILE.name, margin, y);
  y += 7;

  doc.setFontSize(11);
  doc.setTextColor(90);
  doc.text(`${CV_PROFILE.headline} — ${CV_PROFILE.location}`, margin, y);
  y += 6;

  // The PDF travels through pipelines detached from the site, so the header
  // has to carry a reply channel of its own.
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`${CV_PROFILE.email}  ·  ${CV_PROFILE.site}  ·  ${CV_PROFILE.research}`, margin, y);
  y += 8;

  // Summary
  doc.setFontSize(10);
  doc.setTextColor(60);
  for (const line of doc.splitTextToSize(CV_PROFILE.summary, width)) {
    ensureSpace(6);
    doc.text(line, margin, y);
    y += 5;
  }

  // The ask, stated once, right under the summary. Darker than body copy so a
  // skimming reader lands on it before the timeline.
  y += 2;
  doc.setTextColor(20);
  for (const line of doc.splitTextToSize(CV_PROFILE.target, width)) {
    ensureSpace(6);
    doc.text(line, margin, y);
    y += 5;
  }

  // Experience. This comes before the timeline because it is what a hiring
  // reader is looking for; the timeline that follows is the index, not the
  // account.
  sectionHeading("Experience");
  for (const entry of EXPERIENCE) {
    // Keep the role line with at least its first body line rather than
    // stranding a heading at the foot of a page.
    ensureSpace(18);
    doc.setFontSize(10.5);
    doc.setTextColor(20);
    doc.text(`${entry.role} — ${entry.org}`, margin, y);
    y += 4.8;

    doc.setFontSize(8.5);
    doc.setTextColor(130);
    doc.text(entry.location ? `${entry.location} · ${entry.period}` : entry.period, margin, y);
    y += 5;

    doc.setFontSize(9.5);
    doc.setTextColor(60);
    for (const line of doc.splitTextToSize(entry.summary, width)) {
      ensureSpace(5);
      doc.text(line, margin, y);
      y += 4.6;
    }

    doc.setTextColor(80);
    for (const highlight of entry.highlights) {
      const lines = doc.splitTextToSize(highlight, width - 4);
      lines.forEach((line: string, index: number) => {
        ensureSpace(5);
        // The bullet sits on the first line only; continuations hang under it.
        doc.text(index === 0 ? `•  ${line}` : `   ${line}`, margin + 1, y);
        y += 4.4;
      });
    }
    y += 3.5;
  }

  // Methods, with the engagement each one comes from.
  //
  // /cv also carries a "Selected engagements" block that re-indexes Experience
  // by client rather than by employer, because a scrolling reader loses USAID
  // and CMS inside NORC and Rios. That problem does not exist here: Experience
  // above is a fixed block a PDF reader takes in at once, so repeating it under
  // different headings would be duplication rather than navigation. Methods is
  // the part that is genuinely absent otherwise — SKILLS answers "what tools",
  // and nothing else answers "what method, and where".
  sectionHeading("Methods");
  for (const method of METHODS) {
    ensureSpace(12);
    doc.setFontSize(9.5);
    doc.setTextColor(20);
    doc.text(method.label, margin, y);
    y += 4.4;

    doc.setFontSize(9);
    doc.setTextColor(80);
    for (const line of doc.splitTextToSize(method.detail, width - 4)) {
      ensureSpace(5);
      doc.text(line, margin + 1, y);
      y += 4.3;
    }
    y += 2.5;
  }

  sectionHeading("Experience & Education Timeline");
  for (const entry of CAREER_TIMELINE) {
    ensureSpace(12);
    doc.setFontSize(10);
    doc.setTextColor(20);
    doc.text(entry.role, margin + 30, y);
    doc.setTextColor(130);
    doc.setFontSize(9);
    doc.text(entry.years, margin, y);
    y += 5;
    doc.setTextColor(80);
    for (const line of doc.splitTextToSize(entry.note, width - 30)) {
      ensureSpace(5);
      doc.text(line, margin + 30, y);
      y += 4.6;
    }
    y += 2;
  }

  // Education
  sectionHeading("Education");
  for (const entry of EDUCATION) {
    ensureSpace(16);
    doc.setFontSize(10);
    doc.setTextColor(20);
    doc.text(entry.institution, margin, y);
    y += 5;
    doc.setFontSize(9);
    doc.setTextColor(90);
    doc.text(`${entry.credential} · ${entry.location} · ${entry.years}`, margin, y);
    y += 4.6;
    doc.setTextColor(120);
    for (const line of doc.splitTextToSize(entry.detail, width)) {
      ensureSpace(5);
      doc.text(line, margin, y);
      y += 4.4;
    }
    y += 3;
  }

  // Skills
  sectionHeading("Skills");
  for (const group of SKILLS) {
    ensureSpace(10);
    doc.setFontSize(9);
    doc.setTextColor(20);
    doc.text(`${group.label}:`, margin, y);
    doc.setTextColor(90);
    for (const line of doc.splitTextToSize(group.items.join(", "), width - 34)) {
      doc.text(line, margin + 34, y);
      y += 4.6;
      ensureSpace(5);
    }
    y += 1.5;
  }

  // Links
  sectionHeading("Links");
  doc.setFontSize(9);
  doc.setTextColor(90);
  for (const link of CV_PDF_LINKS) {
    ensureSpace(5);
    // Print the address itself, not the mailto: scheme prefix.
    doc.text(`${link.label}: ${link.url.replace(/^mailto:/, "")}`, margin, y);
    y += 4.6;
  }

  return doc;
}
