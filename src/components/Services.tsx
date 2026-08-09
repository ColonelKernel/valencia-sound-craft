import { Code2, Music, Video, ArrowRight, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { useFadeIn } from "@/hooks/useFadeIn";

interface ServiceCard {
  icon: LucideIcon;
  title: string;
  points: string[];
  cta: string;
  /** In-app route for the CTA. Cards without one point at the contact form. */
  href?: string;
}

/**
 * Ordered for a hiring visitor, not a lessons enquiry: the software work leads,
 * because this section is the first thing below the hero and it sets what kind
 * of professional the reader thinks they are looking at. Guitar lessons stay
 * bookable through the contact form's project-type field.
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
    title: "Mixing & Production",
    points: [
      "Production and mixing that bring clarity, depth, and character to your tracks",
      "Blending live instruments with modern production techniques",
      "From early demos to polished, release-ready masters",
    ],
    cta: "Inquire",
  },
  {
    icon: Video,
    title: "Video & Live Sessions",
    points: [
      "High-quality live performance recording — multi-camera + pro audio",
      "Designed for artists, venues, and social media content",
      "Full post-production: editing, mixing, and delivery",
    ],
    cta: "Inquire",
  },
];

const Services = () => {
  const ref = useFadeIn();

  return (
    <section id="services" className="section-padding bg-background" ref={ref}>
      <div className="container mx-auto">
        <div className="fade-up mb-16">
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">What I Do</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Services</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((s, i) => (
            <div
              key={s.title}
              className="fade-up group border border-border rounded-sm p-8 hover:border-foreground/20 transition-colors"
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
              {s.href ? (
                <Link
                  to={s.href}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground group-hover:gap-2.5 transition-all"
                >
                  {s.cta} <ArrowRight size={14} />
                </Link>
              ) : (
                <a
                  href="#contact"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground group-hover:gap-2.5 transition-all"
                >
                  {s.cta} <ArrowRight size={14} />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
