import { ArrowLeft, ArrowUpRight, Download } from "lucide-react";
import { Link } from "react-router-dom";

import RouteHead from "@/components/seo/RouteHead";
import { ROUTE_META } from "@/app/routeMeta";
import { CV_JSONLD } from "@/app/routeStructuredData";
import { CAREER_TIMELINE, CV_PDF_FILENAME, CV_PROFILE, EDUCATION, EXPERIENCE, SKILLS } from "@/content/cv";
import { buttonClasses } from "@/components/ui/button";
import { cardClasses } from "@/components/ui/card";
import { useFadeIn } from "@/hooks/useFadeIn";

/**
 * The links a technical reviewer opens. These used to sit in one flat row with
 * Spotify, SoundCloud and YouTube at identical weight, so the row read as
 * eight equally-plausible next clicks and GitHub was the third of them.
 */
const PROFILE_LINKS: { label: string; url: string }[] = [
  { label: "GitHub", url: CV_PROFILE.profiles.github },
  { label: "Email", url: `mailto:${CV_PROFILE.email}` },
  { label: "Portfolio", url: CV_PROFILE.site },
  { label: "Research", url: CV_PROFILE.research },
  { label: "LinkedIn", url: CV_PROFILE.profiles.linkedin },
];

/** The catalog. Still here, deliberately quieter — it is evidence, not the ask. */
const MUSIC_LINKS: { label: string; url: string }[] = [
  { label: "Spotify", url: CV_PROFILE.profiles.spotify },
  { label: "SoundCloud", url: CV_PROFILE.profiles.soundcloud },
  { label: "YouTube", url: CV_PROFILE.profiles.youtube },
];

const SkillLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <Link
    to={to}
    className="text-foreground underline underline-offset-4 transition-colors hover:text-primary"
  >
    {children}
  </Link>
);

const CVPage = () => {
  const ref = useFadeIn();

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
              <p className="eyebrow mb-3">CV</p>
              <h1 className="type-h1 mb-4">
                {CV_PROFILE.name}
              </h1>
              <p className="text-lg text-muted-foreground mb-2">
                {CV_PROFILE.headline} · {CV_PROFILE.location}
              </p>
              <p className="text-muted-foreground leading-relaxed max-w-2xl mt-5">
                {CV_PROFILE.summary}
              </p>

              {/* The ask. This page listed history for a year and never said
                  what it was for; a reader had to infer it from the hero on a
                  different route. Foreground colour so it reads as a statement
                  rather than more body copy. */}
              <p className={cardClasses({ padding: "none" }, "mt-6 max-w-2xl px-4 py-3 text-sm font-medium leading-relaxed text-foreground")}>
                {CV_PROFILE.target}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-4">
                {/* This was a button that dynamic-imported jsPDF and drew the
                    document in the browser — while build/emitCvPdfPlugin.ts
                    already emits the identical PDF from the same drawCvPdf(),
                    at a fixed URL, at build time. Same document, none of the
                    library, and it still works with JavaScript broken. The
                    separate "Direct link" existed to expose that static file
                    and is now what the button points at. */}
                <a href={`/${CV_PDF_FILENAME}`} download className={buttonClasses({ variant: "secondary" })}>
                  <Download size={15} />
                  Download PDF
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
              <h2 className="eyebrow mb-5">Experience</h2>
              <div className="space-y-4">
                {EXPERIENCE.map((entry) => (
                  <article
                    key={`${entry.org}-${entry.period}`}
                    className={cardClasses({ padding: "md" })}
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                      <h3 className="font-display text-base font-semibold text-foreground">
                        {entry.role}
                        <span className="text-muted-foreground font-normal"> · {entry.org}</span>
                      </h3>
                      <p className="font-mono text-xs text-muted-foreground shrink-0">
                        {entry.location ? `${entry.location} · ` : ""}
                        {entry.period}
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {entry.summary}
                    </p>
                    <ul className="mt-3 space-y-2">
                      {entry.highlights.map((highlight) => (
                        <li
                          key={highlight}
                          className="relative pl-4 text-sm leading-relaxed text-muted-foreground before:absolute before:left-0 before:top-[0.6em] before:h-1 before:w-1 before:rounded-full before:bg-muted-foreground/60"
                        >
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>

            <div className="fade-up mb-12">
              <h2 className="eyebrow mb-5">
                The Path
              </h2>
              <ol className={cardClasses({ padding: "none" }, "divide-y divide-border")}>
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
                <h2 className="eyebrow mb-5">
                  Education
                </h2>
                <div className={cardClasses({ padding: "md" }, "space-y-6")}>
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
                <h2 className="eyebrow mb-5">
                  Skills
                </h2>
                <div className={cardClasses({ padding: "md" }, "space-y-5")}>
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

                {/* The chips were unevidenced on the page and evidenced only in
                    a code comment (src/content/cv.ts, above SKILLS) — which no
                    reviewer reads. This route linked nowhere but the homepage
                    and /#contact; the four case studies it sits on top of were
                    reachable from /projects alone. */}
                <p className="mt-6 text-sm leading-7 text-muted-foreground">
                  Where these are demonstrated: forecasting and the metric layer in{" "}
                  <SkillLink to={ROUTE_META.catalogIntelligence.path}>
                    catalog intelligence
                  </SkillLink>
                  , clustering in{" "}
                  <SkillLink to={ROUTE_META.grooveAtlas.path}>the groove atlas</SkillLink>,
                  ONNX inference in{" "}
                  <SkillLink to={ROUTE_META.autoharm.path}>AutoHarm</SkillLink>, the
                  geospatial pipeline in{" "}
                  <SkillLink to={ROUTE_META.transitAtlas.path}>the transit atlas</SkillLink>,
                  and the schema and classifier work in{" "}
                  <SkillLink to={ROUTE_META.sessionState.path}>
                    the session-state analyzer
                  </SkillLink>
                  .
                </p>
              </div>
            </div>

            <div className="fade-up mb-12">
              <h2 className="eyebrow mb-5">
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

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
                <span className="text-xs uppercase tracking-widest text-muted-foreground/70">
                  Catalog
                </span>
                {MUSIC_LINKS.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label} <ArrowUpRight size={13} />
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
