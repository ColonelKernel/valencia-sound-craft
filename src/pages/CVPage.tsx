import { useCallback, useState } from "react";
import { ArrowLeft, ArrowUpRight, Download } from "lucide-react";
import { Link } from "react-router-dom";

import RouteHead from "@/components/seo/RouteHead";
import { ROUTE_META } from "@/app/routeMeta";
import { CV_JSONLD } from "@/app/routeStructuredData";
import { CAREER_TIMELINE, CV_PROFILE, EDUCATION, SKILLS } from "@/content/cv";
import { useFadeIn } from "@/hooks/useFadeIn";

const PROFILE_LINKS: { label: string; url: string }[] = [
  { label: "Portfolio", url: CV_PROFILE.site },
  { label: "Research", url: CV_PROFILE.research },
  { label: "LinkedIn", url: CV_PROFILE.profiles.linkedin },
  { label: "Spotify", url: CV_PROFILE.profiles.spotify },
  { label: "SoundCloud", url: CV_PROFILE.profiles.soundcloud },
  { label: "YouTube", url: CV_PROFILE.profiles.youtube },
];

const CVPage = () => {
  const ref = useFadeIn();
  const [generating, setGenerating] = useState(false);

  const downloadPdf = useCallback(async () => {
    setGenerating(true);
    try {
      // Loaded on demand so the ~40 KB gzip PDF library never lands in the
      // route chunk — it only downloads when a visitor actually exports.
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();

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

      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(`${CV_PROFILE.site}  ·  ${CV_PROFILE.research}`, margin, y);
      y += 8;

      // Summary
      doc.setFontSize(10);
      doc.setTextColor(60);
      for (const line of doc.splitTextToSize(CV_PROFILE.summary, width) as string[]) {
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
        for (const line of doc.splitTextToSize(entry.note, width - 30) as string[]) {
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
        for (const line of doc.splitTextToSize(entry.detail, width) as string[]) {
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
        for (const line of doc.splitTextToSize(group.items.join(", "), width - 34) as string[]) {
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
      for (const link of PROFILE_LINKS) {
        ensureSpace(5);
        doc.text(`${link.label}: ${link.url}`, margin, y);
        y += 4.6;
      }

      doc.save("Zach-Scheffler-CV.pdf");
    } finally {
      setGenerating(false);
    }
  }, []);

  return (
    <div className="min-h-screen" ref={ref}>
      <RouteHead
        title={ROUTE_META.cv.title}
        description={ROUTE_META.cv.description}
        canonicalPath={ROUTE_META.cv.path}
        jsonLd={CV_JSONLD}
      />
      <main className="pt-16">
        <section className="section-padding bg-background">
          <div className="container mx-auto max-w-4xl">
            <div className="fade-up mb-12">
              <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">CV</p>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                {CV_PROFILE.name}
              </h1>
              <p className="text-lg text-muted-foreground mb-2">
                {CV_PROFILE.headline} · {CV_PROFILE.location}
              </p>
              <p className="text-muted-foreground leading-relaxed max-w-2xl mt-5">
                {CV_PROFILE.summary}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={downloadPdf}
                  disabled={generating}
                  className="inline-flex items-center gap-2 rounded-sm border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-foreground/40 hover:text-primary disabled:opacity-60"
                >
                  <Download size={15} />
                  {generating ? "Generating…" : "Download PDF"}
                </button>
                <Link
                  to={CV_PROFILE.contactPath}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Get in touch <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>

            <div className="fade-up mb-12">
              <h2 className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-5">
                The Path
              </h2>
              <ol className="border border-border rounded-sm divide-y divide-border">
                {CAREER_TIMELINE.map((entry) => (
                  <li
                    key={`${entry.years}-${entry.role}`}
                    className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6 px-5 py-3.5"
                  >
                    <span className="text-xs text-muted-foreground font-mono w-28 shrink-0">
                      {entry.years}
                    </span>
                    <span className="font-display font-semibold text-sm">{entry.role}</span>
                    <span className="text-sm text-muted-foreground">{entry.note}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="fade-up mb-12 grid gap-8 md:grid-cols-2">
              <div>
                <h2 className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-5">
                  Education
                </h2>
                <div className="border border-border rounded-sm p-6 space-y-6">
                  {EDUCATION.map((entry) => (
                    <div
                      key={entry.institution}
                      className="[&:not(:first-child)]:border-t [&:not(:first-child)]:border-border [&:not(:first-child)]:pt-6"
                    >
                      <p className="font-display font-semibold">{entry.institution}</p>
                      <p className="text-sm text-muted-foreground">
                        {entry.credential} · {entry.location} · {entry.years}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{entry.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-5">
                  Skills
                </h2>
                <div className="border border-border rounded-sm p-6 space-y-5">
                  {SKILLS.map((group) => (
                    <div key={group.label}>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                        {group.label}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {group.items.map((item) => (
                          <span
                            key={item}
                            className="text-xs border border-border px-2.5 py-1 rounded-full text-muted-foreground"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="fade-up mb-12">
              <h2 className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-5">
                Elsewhere
              </h2>
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                {PROFILE_LINKS.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-primary"
                  >
                    {link.label} <ArrowUpRight size={14} />
                  </a>
                ))}
              </div>
            </div>

            <div className="fade-up">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft size={16} /> Back to home
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CVPage;
