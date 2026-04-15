import { Cpu, BarChart3, AudioWaveform } from "lucide-react";
import { useFadeIn } from "@/hooks/useFadeIn";

const pillars = [
  {
    icon: Cpu,
    title: "Interactive Music Systems",
    points: [
      "Generative engines and real-time audiovisual tools",
      "Playable interfaces — maps, rhythm engines, synthesis systems",
      "Position-constrained improvisation and fretboard intelligence",
    ],
  },
  {
    icon: BarChart3,
    title: "Music Data & Analytics",
    points: [
      "Streaming analytics dashboards and recommendation systems",
      "Catalog intelligence, segmentation, and reporting tools",
      "Time-series modeling and behavioral pattern analysis",
    ],
  },
  {
    icon: AudioWaveform,
    title: "Audio & Sound Design",
    points: [
      "System-driven composition and hybrid audio workflows",
      "Sound as data and structure — generative and reactive",
      "Multi-genre production across electronic, rock, jazz, and Latin",
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
