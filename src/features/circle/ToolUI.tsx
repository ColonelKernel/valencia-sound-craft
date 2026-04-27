import { type ReactNode } from "react";
import { useLanguage } from "@/i18n/site";

interface CircleToolUIProps {
  tool: ReactNode;
}

const CircleToolUI = ({ tool }: CircleToolUIProps) => {
  const { t } = useLanguage();

  return (
  <section aria-labelledby="circle-tool-section" className="space-y-4">
    <header className="space-y-2">
      <h2 id="circle-tool-section" className="text-2xl font-semibold text-foreground">
        {t("tools.circle.uiTitle")}
      </h2>
      <p className="text-sm text-muted-foreground">
        {t("tools.circle.uiCopy")}
      </p>
    </header>
    {tool}
  </section>
  );
};

export default CircleToolUI;
