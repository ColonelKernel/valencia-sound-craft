import { type ReactNode } from "react";
import { useLanguage } from "@/i18n/site";

interface HarmonyToolUIProps {
  workspace: ReactNode;
}

const HarmonyToolUI = ({ workspace }: HarmonyToolUIProps) => {
  const { t } = useLanguage();

  return (
  <section aria-labelledby="harmony-tool-section" className="space-y-4">
    <header className="space-y-2">
      <h2 id="harmony-tool-section" className="text-2xl font-semibold text-foreground">
        {t("tools.harmony.uiTitle")}
      </h2>
      <p className="text-sm text-muted-foreground">
        {t("tools.harmony.uiCopy")}
      </p>
    </header>
    {workspace}
  </section>
  );
};

export default HarmonyToolUI;
