import { describe, expect, it } from "vitest";

import { CAREER_TIMELINE, CV_PDF_FILENAME, CV_PROFILE, EDUCATION, SKILLS } from "./cv";
import { CV_PDF_LINKS, drawCvPdf, type CvPdfDoc } from "./cvPdf";

/**
 * drawCvPdf is shared by the /cv download button and build/emitCvPdfPlugin.ts,
 * which writes the static copy served at the site root. Nothing else asserts
 * that the two stay wired to src/content/cv.ts, so this does: it draws onto a
 * recording stub and checks the essentials actually reach the page.
 *
 * A real jsPDF is deliberately not used — the point is to pin the content that
 * gets drawn, not to re-test the PDF library.
 */

/** Records every string drawn, so the test can assert on the document body. */
function createRecordingDoc() {
  const lines: string[] = [];
  let pages = 1;
  const doc: CvPdfDoc = {
    setFontSize: () => undefined,
    setTextColor: () => undefined,
    setDrawColor: () => undefined,
    line: () => undefined,
    addPage: () => {
      pages += 1;
    },
    text: (value: string) => {
      lines.push(value);
    },
    // The real jsPDF wraps to the column width; one line per call is enough
    // to keep the recorded text searchable.
    splitTextToSize: (value: string) => [value],
  };
  return { doc, lines, pageCount: () => pages };
}

describe("drawCvPdf", () => {
  const { doc, lines, pageCount } = createRecordingDoc();
  drawCvPdf(doc);
  const body = lines.join("\n");

  it("draws the header identity and a reply channel", () => {
    expect(body).toContain(CV_PROFILE.name);
    expect(body).toContain(CV_PROFILE.headline);
    // The PDF travels detached from the site; without an address on it a
    // recruiter reading the file alone has no way to answer.
    expect(body).toContain(CV_PROFILE.email);
    expect(body).toContain(CV_PROFILE.site);
  });

  it("draws every timeline entry, education entry, and skill group", () => {
    for (const entry of CAREER_TIMELINE) {
      expect(body, `missing timeline role: ${entry.role}`).toContain(entry.role);
    }
    for (const entry of EDUCATION) {
      expect(body, `missing institution: ${entry.institution}`).toContain(entry.institution);
    }
    for (const group of SKILLS) {
      expect(body, `missing skill group: ${group.label}`).toContain(group.label);
    }
  });

  it("draws each profile link with the mailto scheme stripped", () => {
    for (const link of CV_PDF_LINKS) {
      expect(body).toContain(`${link.label}: ${link.url.replace(/^mailto:/, "")}`);
    }
    expect(body).not.toContain("mailto:");
  });

  it("paginates rather than overflowing a single page", () => {
    expect(pageCount()).toBeGreaterThan(1);
  });

  it("keeps one filename for both copies of the document", () => {
    expect(CV_PDF_FILENAME).toMatch(/^[A-Za-z0-9-]+\.pdf$/);
  });
});
