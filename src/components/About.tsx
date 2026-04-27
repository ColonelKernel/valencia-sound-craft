import { useFadeIn } from "@/hooks/useFadeIn";
import { useLanguage } from "@/i18n/site";

const About = () => {
  const ref = useFadeIn();
  const { t } = useLanguage();

  return (
    <section id="about" className="section-padding bg-background" ref={ref}>
      <div className="container mx-auto max-w-3xl">
        <div className="fade-up space-y-12">
          {/* Approach */}
          <div className="space-y-6">
            <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">{t("about.approach.eyebrow")}</p>
            <p className="text-lg leading-relaxed text-muted-foreground md:text-xl">
              {t("about.approach.copy")}
            </p>
          </div>

          {/* Current Direction */}
          <div className="border-t border-border pt-10 space-y-6">
            <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">{t("about.direction.eyebrow")}</p>
            <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
              {t("about.direction.copy")}
            </p>
          </div>

          {/* Education — compact */}
          <div className="border-t border-border pt-10 space-y-6">
            <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">{t("about.background.eyebrow")}</p>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <p className="font-display font-semibold text-sm">Berklee College of Music</p>
                <p className="text-xs text-muted-foreground mt-1">{t("about.berklee.degree")}</p>
              </div>
              <div>
                <p className="font-display font-semibold text-sm">UCLA Luskin School</p>
                <p className="text-xs text-muted-foreground mt-1">{t("about.ucla.degree")}</p>
              </div>
              <div>
                <p className="font-display font-semibold text-sm">MIT Professional Education</p>
                <p className="text-xs text-muted-foreground mt-1">{t("about.mit.degree")}</p>
              </div>
              <div>
                <p className="font-display font-semibold text-sm">Grinnell College</p>
                <p className="text-xs text-muted-foreground mt-1">{t("about.grinnell.degree")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
