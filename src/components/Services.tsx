import { Guitar, Music, Video, ArrowRight } from "lucide-react";
import { useFadeIn } from "@/hooks/useFadeIn";

const services = [
  {
    icon: Guitar,
    title: "Guitar Lessons",
    points: [
      "Personalized lessons for all levels",
      "Rock, jazz, Latin, and contemporary styles",
      "Available in Valencia or online",
    ],
    cta: "Contact to Book",
  },
  {
    icon: Music,
    title: "Mixing & Production",
    points: [
      "Full-track production from demo to final master",
      "Mixing, vocal tuning, and arrangement support",
      "Creative sound design and modern production techniques",
    ],
    cta: "Start a Project",
  },
  {
    icon: Video,
    title: "Video & Live Sessions",
    points: [
      "High-quality audio + multi-camera performance recording",
      "Live session production for artists and venues",
      "Content optimized for social media and promotion",
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
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">What I Do</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Services</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
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
