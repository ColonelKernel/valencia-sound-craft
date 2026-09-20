import { LineChart, Brain, Code2, ArrowRight, type LucideIcon } from "lucide-react";
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
   * data card points at the atlas — 201 systems, the one unambiguously
   * geospatial artifact here, and previously unreachable from this page —
   * without taking the CV away from the reader who came for it.
   */
  secondary?: { label: string; href: string };
}

/**
 * The three bodies of work a hiring reader is deciding between, ordered by the
 * market being addressed: applied data first, the ML that ships second, the
 * systems engineering under both third.
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
    icon: LineChart,
    title: "Applied Data Science",
    points: [
      "Applied data work from 2016 to 2023 across the World Bank, NORC at the University of Chicago, and Rios Partners, where I grew the data strategy work from an informal group into a standing practice and led it",
      "World Transit Atlas — 201 metro and light-rail systems assembled from OpenStreetMap and open agency data, with a ridership comparability audit that dismantled my own headline finding",
      "NLP, geospatial and web-scraping pipelines; statistical modeling and forecasting in Python, R and SQL. UCLA M.P.P. with a thesis prepared for the World Bank; MIT Applied Data Science certificate",
    ],
    cta: "Open the transit atlas",
    href: "/projects/transit-atlas",
    secondary: { label: "Read the CV", href: "/cv" },
  },
  {
    icon: Brain,
    title: "Models That Ship",
    points: [
      "AutoHarm — a four-corpus Markov blend alongside JazzNet RNN and LSTM models running on-device in ONNX, playing live MIDI into a DAW",
      "Music Catalog Intelligence — acquisition scoring, regression forecasting and rolling-variance risk over a public Spotify dataset",
      "Groove Atlas — k-means clustering over a drum-performance dataset, rendered as a canvas feel-space that holds frame rate at thousands of points",
    ],
    cta: "Open the case study",
    href: "/projects/autoharm",
  },
  {
    icon: Code2,
    title: "Systems & Audio Engineering",
    points: [
      "TypeScript and Web Audio: five routed workspaces sharing one transport, clock and lookahead scheduler",
      "C++ and CMake in vcv-rack-mcp, with an allocation-free audio-thread test and a fuzz target in its suite",
      "Every push and pull request passes typecheck, a zero-warning lint, the unit suites, a Playwright run, a 150 KB gzip budget and Lighthouse CI holding accessibility at 1.0 on all sixteen routes",
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
          <h2 className="type-h1">Pipelines, Models, and Shipped Systems</h2>
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
                {s.secondary && (
                  <Link
                    to={s.secondary.href}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {s.secondary.label} <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
