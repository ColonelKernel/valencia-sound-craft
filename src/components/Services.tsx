import { Guitar, Music, Video, ArrowRight } from "lucide-react";
import { useFadeIn } from "@/hooks/useFadeIn";

const services = [
  {
    icon: Guitar,
    title: "Guitar Lessons",
    points: [
      "Learn through real music — rock, jazz, Latin, and contemporary styles",
      "Focus on improvisation, groove, and musical feel over theory alone",
      "Available in Valencia or online — all levels welcome",
    ],
    cta: "Contact to Book",
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
  {
    icon: Music,
    title: "Interactive Music Tools",
    points: [
      "Custom-built fretboard visualizers, scale explorers, and metronomes",
      "Designed to make music theory intuitive and accessible",
      "Tools for guitarists, bassists, and multi-instrumentalists",
    ],
    cta: "Start a Project",
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

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
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
              <a
                href="#contact"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground group-hover:gap-2.5 transition-all"
              >
                {s.cta} <ArrowRight size={14} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
