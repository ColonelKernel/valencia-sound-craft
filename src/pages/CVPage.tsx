import { useCallback, useState } from "react";
import { ArrowLeft, ArrowUpRight, Download } from "lucide-react";
import { Link } from "react-router-dom";

import RouteHead from "@/components/seo/RouteHead";
import { ROUTE_META } from "@/app/routeMeta";
import { CV_JSONLD } from "@/app/routeStructuredData";
import { CAREER_TIMELINE, CV_PDF_FILENAME, CV_PROFILE, EDUCATION, SKILLS } from "@/content/cv";
import { useFadeIn } from "@/hooks/useFadeIn";

const PROFILE_LINKS: { label: string; url: string }[] = [
  { label: "Email", url: `mailto:${CV_PROFILE.email}` },
  { label: "Portfolio", url: CV_PROFILE.site },
  { label: "GitHub", url: CV_PROFILE.profiles.github },
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
      // Both loaded on demand so the ~40 KB gzip PDF library and the layout
      // never land in the route chunk — they download only when a visitor
      // actually exports. drawCvPdf is the same routine the build plugin runs
      // to emit the static copy, so the two can never disagree.
      const [{ jsPDF }, { drawCvPdf }] = await Promise.all([
        import("jspdf"),
        import("@/content/cvPdf"),
      ]);
      drawCvPdf(new jsPDF()).save(CV_PDF_FILENAME);
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
                {/* The same document at a fixed URL, generated at build time —
                    what to paste into an application form or an email. */}
                <a
                  href={`/${CV_PDF_FILENAME}`}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Direct link <ArrowUpRight size={14} />
                </a>
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
