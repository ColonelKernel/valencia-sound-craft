import { type ReactNode } from "react";
import { useLanguage } from "@/i18n/site";

interface RhythmToolUIProps {
  summaryLabel: string;
  tempo: number;
  source: string;
  engine: ReactNode;
  legacyWorkspace: ReactNode;
}

const RhythmToolUI = ({ summaryLabel, tempo, source, engine, legacyWorkspace }: RhythmToolUIProps) => {
  const { t } = useLanguage();

  return (
  <div className="space-y-6">
    <section aria-labelledby="rhythm-engine-section" className="space-y-4">
      <header className="space-y-2">
        <h2 id="rhythm-engine-section" className="text-2xl font-semibold text-foreground">
          {t("tools.rhythm.uiTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("tools.rhythm.current")}: {summaryLabel}. {t("tools.rhythm.sharedTempo")}: {tempo} BPM.
        </p>
        <p className="text-xs text-muted-foreground">{t("tools.rhythm.sourceThread")}: {source}</p>
      </header>
      {engine}
    </section>

    <article className="space-y-4 rounded-[1.5rem] border border-border/70 bg-card/60 p-5">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">{t("tools.rhythm.classicTitle")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("tools.rhythm.classicCopy")}
        </p>
      </header>
      {legacyWorkspace}
    </article>
  </div>
  );
};

export default RhythmToolUI;
