import { BarChart3, Music2, Layout, type LucideIcon } from "lucide-react";
import { useFadeIn } from "@/hooks/useFadeIn";
import { useLanguage, type TranslationKey } from "@/i18n/site";

const pillars = [
  {
    icon: BarChart3,
    title: "services.data.title",
    points: ["services.data.point1", "services.data.point2", "services.data.point3"],
  },
  {
    icon: Music2,
    title: "services.music.title",
    points: ["services.music.point1", "services.music.point2", "services.music.point3"],
  },
  {
    icon: Layout,
    title: "services.web.title",
    points: ["services.web.point1", "services.web.point2", "services.web.point3"],
  },
] satisfies Array<{ icon: LucideIcon; title: TranslationKey; points: TranslationKey[] }>;

const Services = () => {
  const ref = useFadeIn();
  const { t } = useLanguage();

  return (
    <section id="services" className="section-padding bg-background" ref={ref}>
      <div className="container mx-auto">
        <div className="fade-up mb-16">
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">{t("services.eyebrow")}</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">{t("services.title")}</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {pillars.map((s, i) => (
            <div
              key={s.title}
              className="fade-up group border border-border rounded-lg p-8 hover:border-foreground/20 transition-colors"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <s.icon className="text-foreground mb-6" size={28} strokeWidth={1.5} />
              <h3 className="text-xl font-display font-semibold mb-5">{t(s.title)}</h3>
              <ul className="space-y-3">
                {s.points.map((p) => (
                  <li key={p} className="text-sm text-muted-foreground leading-relaxed flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground/50 shrink-0" />
                    {t(p)}
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
