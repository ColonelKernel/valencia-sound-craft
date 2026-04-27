import { type ReactNode } from "react";
import { useLanguage } from "@/i18n/site";

interface TonnetzToolUIProps {
  tool: ReactNode;
}

const TonnetzToolUI = ({ tool }: TonnetzToolUIProps) => {
  const { t } = useLanguage();

  return (
  <section aria-labelledby="tonnetz-tool-section" className="space-y-4">
    <header className="space-y-2">
      <h2 id="tonnetz-tool-section" className="text-2xl font-semibold text-foreground">
        {t("tools.tonnetz.uiTitle")}
      </h2>
      <p className="text-sm text-muted-foreground">
        {t("tools.tonnetz.uiCopy")}
      </p>
    </header>
    {tool}
  </section>
  );
};

export default TonnetzToolUI;
