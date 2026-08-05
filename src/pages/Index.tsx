import { lazy, Suspense } from "react";

import Hero from "@/components/Hero";
import RouteHead from "@/components/seo/RouteHead";
import SystemsPreview from "@/components/SystemsPreview";
import { useInView } from "@/hooks/useInView";
import { ROUTE_META } from "@/app/routeMeta";
import { HOME_JSONLD } from "@/app/routeStructuredData";

const AnalyticsPreview = lazy(() => import("@/components/AnalyticsPreview"));
const Services = lazy(() => import("@/components/Services"));
const Portfolio = lazy(() => import("@/components/Portfolio"));
const About = lazy(() => import("@/components/About"));
const Contact = lazy(() => import("@/components/Contact"));

interface SectionFallbackProps {
  id?: string;
  className?: string;
}

const SectionFallback = ({ id, className = "bg-background" }: SectionFallbackProps) => (
  <section id={id} className={`section-padding ${className}`}>
    <div className="container mx-auto">
      <div className="h-24 rounded-[1.75rem] border border-border/70 bg-card/45" />
    </div>
  </section>
);

const DeferredAnalyticsPreview = () => {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div ref={ref} className="min-h-[36rem]">
      {inView && (
        <Suspense fallback={<SectionFallback className="bg-secondary/50" />}>
          <AnalyticsPreview />
        </Suspense>
      )}
    </div>
  );
};

const Index = () => {
  return (
    <div className="min-h-screen">
      <RouteHead
        title={ROUTE_META.home.title}
        description={ROUTE_META.home.description}
        canonicalPath={ROUTE_META.home.path}
        jsonLd={HOME_JSONLD}
      />
      <main>
        <Hero />

        <Suspense fallback={<SectionFallback id="services" className="bg-background" />}>
          <Services />
        </Suspense>

        <Suspense fallback={<SectionFallback id="portfolio" className="bg-secondary/50" />}>
          <Portfolio />
        </Suspense>

        <SystemsPreview />
        <DeferredAnalyticsPreview />

        <Suspense fallback={<SectionFallback id="about" className="bg-background" />}>
          <About />
        </Suspense>
        <Suspense fallback={<SectionFallback id="contact" className="bg-background" />}>
          <Contact />
        </Suspense>
      </main>
    </div>
  );
};

export default Index;
