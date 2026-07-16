import GrooveIntelligenceLab from "@/components/GrooveIntelligence";
import RouteHead from "@/components/seo/RouteHead";
import { ROUTE_META } from "@/app/routeMeta";

export default function GrooveIntelligencePage() {
  return (
    <>
      <RouteHead
        title={ROUTE_META.grooveIntelligence.title}
        description={ROUTE_META.grooveIntelligence.description}
        canonicalPath={ROUTE_META.grooveIntelligence.path}
      />
      {/* Clear the fixed Navbar; the lab previously rendered chrome-less. */}
      <main className="pt-16">
        <GrooveIntelligenceLab />
      </main>
    </>
  );
}
