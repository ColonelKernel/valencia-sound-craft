import { LineChart, Landmark, Code2, ArrowRight, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { cardClasses } from "@/components/ui/card";
import { useFadeIn } from "@/hooks/useFadeIn";

interface ServiceCard {
  icon: LucideIcon;
  title: string;
  points: string[];
  cta: string;
  /** In-app route for the CTA — every card sends the reader to the work itself. */
  href: string;
  /**
   * A second destination, where one card has two things a reader wants. The
   * public-sector card points at research.zachscheffler.com — the writing, which
   * a research or NGO reader wants and which was previously a footer link —
   * without taking the CV away from the reader who came for that.
   *
   * May be an in-app route or an absolute URL; the render branches on it.
   */
  secondary?: { label: string; href: string };
}

/**
 * The three bodies of work a hiring reader is deciding between, ordered by the
 * market being addressed: the public-sector record first, the transportation
 * specialism second, the software under both third.
 *
 * The target is government, multilateral and non-profit research, plus the
 * consultancies that serve them. Those readers screen on sector and method
 * before they screen on tooling, which is why the first card is a list of who
 * the work was for and what it was — not a list of capabilities.
 *
 * This section used to be headed "Services" with cards for mixing and live
 * sessions. That is vendor framing, and on the page directly below a hero that
 * says "open to new roles" it answered a question nobody asked. The music work
 * did not disappear - it lives in src/content/work.ts and renders in the
 * Portfolio section on this same page and on /work.
 *
 * Every bullet names something that exists in this repo or in a public one.
 */
const services: ServiceCard[] = [
  {
    icon: Landmark,
    title: "Public Sector & Policy Research",
    // The site named World Bank and NORC in one hero sentence and put
    // everything else — USAID, CMS, the Robert Wood Johnson Foundation, the
    // fieldwork — inside /cv alone. Seven years of work for governments,
    // multilaterals and foundations was reaching a reader as a name-drop.
    points: [
      "World Bank, Lima — managed 14 field teams across metropolitan Lima and the rural Sierra Central, and built the project database that reported on fieldwork in real time",
      "NORC at the University of Chicago — over six million exam records assembled from Tanzania's National Examinations Council, mapping primary-to-secondary retention to inform USAID's Country Development Cooperation Strategy",
      "Rios Partners — a new enterprise data inventory for the Centers for Medicare and Medicaid Services, and the data strategy practice I grew and led",
    ],
    cta: "Read the CV",
    href: "/cv",
    secondary: { label: "Research writing", href: "https://research.zachscheffler.com" },
  },
  {
    icon: LineChart,
    title: "Transportation & Geospatial",
    points: [
      "World Transit Atlas — 201 rail systems and 22,641 stations assembled from OpenStreetMap, citylines.co and open agency data, at real alignments rather than schematics",
      "A ridership audit that dismantled my own significant result: agencies count boardings, linked journeys and faregate entries differently, and the convention was unrecorded for 177 of 201 systems",
      "UCLA M.P.P. in Transportation & Urban Development; geospatial, NLP and web-scraping pipelines in Python, R and SQL",
    ],
    cta: "Open the transit atlas",
    href: "/projects/transit-atlas",
  },
  {
    icon: Code2,
    title: "Models and Systems That Ship",
    // Merged from two cards. For this market the distinction between "the ML"
    // and "the engineering under it" is one a reader does not need; what they
    // need is that the person doing the analysis also builds the thing.
    points: [
      "Music Catalog Intelligence — acquisition scoring, regression forecasting and rolling-variance risk, with the prediction interval's defect documented rather than hidden",
      "AutoHarm — a four-corpus Markov blend and two ONNX models running on-device in the browser",
      "Every push and pull request passes typecheck, a zero-warning lint, the unit and end-to-end suites, a bundle budget, and Lighthouse CI holding accessibility at 1.0",
    ],
    cta: "See the projects",
    href: "/projects",
  },
];

const Services = () => {
  const ref = useFadeIn();

  return (
    <section id="evidence" className="section-padding bg-background" ref={ref}>
      <div className="container mx-auto">
        <div className="fade-up mb-16">
          <p className="eyebrow mb-3">Evidence</p>
          <h2 className="type-h1">Public Sector Data, and the Systems Built On It</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((s, i) => (
            <div
              key={s.title}
              className={cardClasses({ padding: "md", interactive: true }, "fade-up group flex flex-col")}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <s.icon className="text-foreground mb-6" size={28} strokeWidth={1.5} />
              <h3 className="text-xl font-display font-semibold mb-4">{s.title}</h3>
              <ul className="space-y-3 mb-8">
                {s.points.map((p) => (
                  <li key={p} className="text-sm text-muted-foreground leading-relaxed">
                    {p}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2">
                <Link
                  to={s.href}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground group-hover:gap-2.5 transition-all"
                >
                  {s.cta} <ArrowRight size={14} />
                </Link>
                {/* The research dossier is a second site, so this has to be a
                    real anchor — a router <Link> to an https URL renders a
                    relative path and 404s. */}
                {s.secondary &&
                  (s.secondary.href.startsWith("/") ? (
                    <Link
                      to={s.secondary.href}
                      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {s.secondary.label} <ArrowRight size={13} />
                    </Link>
                  ) : (
                    <a
                      href={s.secondary.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {s.secondary.label} <ArrowRight size={13} />
                    </a>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
