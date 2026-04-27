import { type ReactNode } from "react";
import { useLanguage } from "@/i18n/site";

interface MapToolUIProps {
  engine: ReactNode;
}

const MapToolUI = ({ engine }: MapToolUIProps) => {
  const { t } = useLanguage();

  return (
  <section aria-labelledby="map-tool-section" className="space-y-4">
    <header className="space-y-2">
      <h2 id="map-tool-section" className="text-2xl font-semibold text-foreground">
        {t("tools.map.uiTitle")}
      </h2>
      <p className="text-sm text-muted-foreground">
        {t("tools.map.uiCopy")}
      </p>
    </header>
    {engine}
  </section>
  );
};

export default MapToolUI;
