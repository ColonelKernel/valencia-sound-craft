import { ArrowRight, Brain, Globe2, Hexagon, Music2, RadioTower, Sparkles, TrainFront, Waves, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage, type TranslationKey } from "@/i18n/site";

const previewCards = [
  {
    to: "/groove-intelligence",
    icon: Brain,
    title: "systems.card.groove.title",
    description: "systems.card.groove.description",
    featured: true,
  },
  {
    to: "/music-intelligence",
    icon: Sparkles,
    title: "systems.card.amie.title",
    description: "systems.card.amie.description",
  },
  {
    to: "/transit-synth",
    icon: TrainFront,
    title: "systems.card.transit.title",
    description: "systems.card.transit.description",
  },
  {
    to: "/tools/rhythm",
    icon: Globe2,
    title: "systems.card.rhythm.title",
    description: "systems.card.rhythm.description",
  },
  {
    to: "/tools/harmony",
    icon: Music2,
    title: "systems.card.harmony.title",
    description: "systems.card.harmony.description",
  },
  {
    to: "/tools/map",
    icon: RadioTower,
    title: "systems.card.map.title",
    description: "systems.card.map.description",
  },
  {
    to: "/tools/circle",
    icon: Waves,
    title: "systems.card.circle.title",
    description: "systems.card.circle.description",
  },
  {
    to: "/tools/tonnetz",
    icon: Hexagon,
    title: "systems.card.tonnetz.title",
    description: "systems.card.tonnetz.description",
  },
] satisfies Array<{ to: string; icon: LucideIcon; title: TranslationKey; description: TranslationKey; featured?: boolean }>;

const SystemsPreview = () => {
  const { t } = useLanguage();

  return (
  <section id="systems" className="section-padding !pb-8 border-y border-border/70 bg-secondary/50 scroll-mt-24">
    <div className="container mx-auto space-y-8">
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">{t("systems.eyebrow")}</p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
              {t("systems.title")}
            </h2>
            <p className="text-sm text-muted-foreground md:text-base">
              {t("systems.description")}
            </p>
          </div>

          <Link
            to="/tools"
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-5 py-3 text-sm font-semibold text-foreground hover:bg-primary/15"
          >
            {t("hero.exploreTools")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {previewCards.map((card) => {
          const featured = 'featured' in card && card.featured;
          return (
            <article
              key={card.to}
              className={`rounded-[1.5rem] border p-5 shadow-[0_20px_45px_-34px_rgba(0,0,0,0.8)] ${
                featured
                  ? "md:col-span-2 xl:col-span-3 border-emerald-500/30 bg-emerald-950/20"
                  : "border-border/70 bg-card/75"
              }`}
            >
              <div className={featured ? "flex flex-col md:flex-row md:items-center md:gap-8" : ""}>
                <div className={featured ? "flex-1" : ""}>
                  <div className="flex items-center gap-2">
                    <card.icon className={`h-5 w-5 ${featured ? "text-emerald-400" : "text-primary"}`} />
                    {featured && <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400/70 bg-emerald-400/10 px-2 py-0.5 rounded-full">{t("systems.featuredBadge")}</span>}
                  </div>
                  <h3 className={`mt-4 font-semibold text-foreground ${featured ? "text-2xl" : "text-lg"}`}>{t(card.title)}</h3>
                  <p className={`mt-2 leading-6 text-muted-foreground ${featured ? "text-base max-w-2xl" : "text-sm"}`}>{t(card.description)}</p>
                </div>
                <Link
                  to={card.to}
                  className={`mt-5 md:mt-0 inline-flex items-center gap-2 font-medium hover:text-primary ${
                    featured
                      ? "text-base text-emerald-400 hover:text-emerald-300 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-5 py-3"
                      : "text-sm text-foreground"
                  }`}
                >
                  {featured ? t("systems.openGroove") : t("systems.openTool")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  </section>
  );
};

export default SystemsPreview;
