import { lazy, Suspense } from "react";

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import RouteHead, { createToolStructuredData } from "@/components/seo/RouteHead";
import SystemsPreview from "@/components/SystemsPreview";

const Services = lazy(() => import("@/components/Services"));
const Portfolio = lazy(() => import("@/components/Portfolio"));
const About = lazy(() => import("@/components/About"));
const Contact = lazy(() => import("@/components/Contact"));
const Footer = lazy(() => import("@/components/Footer"));

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

const Index = () => {
  return (
    <div className="min-h-screen">
      <RouteHead
        title="Valencia Sound Craft"
        description="Music systems design, creative technology, and direct-linkable rhythm and harmony tools."
        canonicalPath="/"
        jsonLd={createToolStructuredData({
          name: "Valencia Sound Craft",
          description:
            "A creative music technology site featuring portfolio work and interactive rhythm and harmony tools.",
          canonicalPath: "/",
          educationalUse: ["music technology", "composition", "practice"],
        })}
      />
      <Navbar />
      <main>
        <Hero />

        <Suspense fallback={<SectionFallback id="services" className="bg-background" />}>
          <Services />
        </Suspense>

        <SystemsPreview />

        <Suspense fallback={<SectionFallback id="portfolio" className="bg-secondary/50" />}>
          <Portfolio />
        </Suspense>
        <Suspense fallback={<SectionFallback id="about" className="bg-background" />}>
          <About />
        </Suspense>
        <Suspense fallback={<SectionFallback id="contact" className="bg-background" />}>
          <Contact />
        </Suspense>
      </main>
      <Suspense fallback={<SectionFallback className="bg-background" />}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Index;
