import { BarChart3, Music2, Layout } from "lucide-react";
import { useFadeIn } from "@/hooks/useFadeIn";

const pillars = [
  {
    icon: BarChart3,
    title: "Data Analysis",
    points: [
      "Streaming analytics dashboards and catalog intelligence",
      "Recommendation systems and behavioral modeling",
      "Time-series forecasting and reporting tools",
    ],
  },
  {
    icon: Music2,
    title: "Digital Music Tools",
    points: [
      "Generative engines and real-time audiovisual instruments",
      "Playable interfaces — maps, rhythm engines, synthesis systems",
      "Position-constrained improvisation and fretboard intelligence",
    ],
  },
  {
    icon: Layout,
    title: "Web Design",
    points: [
      "Editorial, product-grade interfaces with motion and interaction",
      "Custom React + TypeScript applications and design systems",
      "Performance-tuned, responsive, and SEO-ready builds",
    ],
  },
];

const Services = () => {
  const ref = useFadeIn();

  return (
    <section id="services" className="section-padding bg-background" ref={ref}>
      <div className="container mx-auto">
        <div className="fade-up mb-16">
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">Capabilities</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">What I Build</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {pillars.map((s, i) => (
            <div
              key={s.title}
              className="fade-up group border border-border rounded-lg p-8 hover:border-foreground/20 transition-colors"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <s.icon className="text-foreground mb-6" size={28} strokeWidth={1.5} />
              <h3 className="text-xl font-display font-semibold mb-5">{s.title}</h3>
              <ul className="space-y-3">
                {s.points.map((p) => (
                  <li key={p} className="text-sm text-muted-foreground leading-relaxed flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground/50 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
