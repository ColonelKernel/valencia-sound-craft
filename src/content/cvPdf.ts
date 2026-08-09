/**
 * CV PDF layout — the single drawing routine behind both copies of the résumé.
 *
 * Two callers share this file:
 *   1. src/pages/CVPage.tsx, which dynamic-imports jspdf when a visitor clicks
 *      Download, so the library never lands in the route chunk.
 *   2. build/emitCvPdfPlugin.ts, which runs the same code under Node at build
 *      time and writes dist/Zach-Scheffler-CV.pdf — a stable, crawlable URL to
 *      put on applications. Because both go through here, the static file
 *      cannot drift from src/content/cv.ts.
 *
 * CONSTRAINTS, both load-bearing:
 *   - Relative imports only. The build plugin enters the Vite config load
 *     chain, where the "@/" alias does not resolve.
 *   - No DOM. tsconfig.node.json compiles this with lib ES2023 and no DOM
 *     types, so anything touching window/document fails typecheck.
 */

import { CAREER_TIMELINE, CV_PDF_FILENAME, CV_PROFILE, EDUCATION, SKILLS } from "./cv";

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

  // Experience
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
