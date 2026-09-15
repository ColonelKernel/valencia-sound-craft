import { Code2, Music, Video, ArrowRight, type LucideIcon } from "lucide-react";
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
}

/**
 * Ordered for a hiring visitor, not a lessons enquiry: the software work leads,
 * because this section is the first thing below the hero and it sets what kind
 * of professional the reader thinks they are looking at. Guitar lessons stay
 * bookable through the contact form's project-type field.
 *
 * Every bullet below names something that exists. The music cards used to read
 * as service-agency copy ("clarity, depth, and character"), which on a page
 * aimed at hiring managers undercut the specific card above it — so they cite
 * the releases and sessions in src/content/work.ts instead, and point at /work
 * where the reader can hear them rather than at a contact form.
 */
const services: ServiceCard[] = [
  {
    icon: Code2,
    title: "Music Software & Tools",
    points: [
      "Browser instruments and audio tools: rhythm engine, harmony lab, Tonnetz",
      "TypeScript and Web Audio, five workspaces sharing one transport and clock",
      "Shipped with tests, CI, and performance budgets — the source is public",
    ],
    cta: "Try the tools",
    href: "/tools",
  },
  {
    icon: Music,
    title: "Production & Mixing",
    points: [
      "Global Pulse — a five-track debut EP, written, produced and mixed as my Berklee Valencia culminating experience",
      "Field recordings, modular synthesis, AI-assisted vocal processing and a multi-DAW pipeline, across Neo Soul, experimental electronic and rock",
      "Streetcar Scandal — my own artist project, writing and producing under that name since 2013",
    ],
    cta: "Hear the EP",
    href: "/work",
  },
  {
    icon: Video,
    title: "Recording & Live Sessions",
    points: [
      "Verva, Russafa Archives — I recorded the band's sessions at Berklee Valencia's studios",
      "Cristian Chiaburu, Momentum — live studio session video",
      "La Vitti — a five-song live session, recorded and filmed in Valencia",
    ],
    cta: "Watch the sessions",
    href: "/work",
  },
];

const Services = () => {
  const ref = useFadeIn();

  return (
    <section id="services" className="section-padding bg-background" ref={ref}>
      <div className="container mx-auto">
        <div className="fade-up mb-16">
          <p className="eyebrow mb-3">What I Do</p>
          <h2 className="type-h1">Services</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((s, i) => (
            <div
              key={s.title}
              className={cardClasses({ padding: "md", interactive: true }, "fade-up group")}
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
              <Link
                to={s.href}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground group-hover:gap-2.5 transition-all"
              >
                {s.cta} <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
