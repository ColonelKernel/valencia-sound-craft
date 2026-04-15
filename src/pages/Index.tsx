import { lazy, Suspense } from "react";

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import RouteHead, { createToolStructuredData } from "@/components/seo/RouteHead";
import SystemsPreview from "@/components/SystemsPreview";
import AnalyticsPreview from "@/components/AnalyticsPreview";

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
      <div className="h-24 rounded-xl border border-border/70 bg-card/45" />
    </div>
  </section>
);

const Index = () => {
  return (
    <div className="min-h-screen">
      <RouteHead
        title="ZS — Music, Data & Interactive Systems"
        description="Creative technologist building systems for understanding, generating, and interacting with music — from intelligent engines to playable audiovisual instruments."
        canonicalPath="/"
        jsonLd={createToolStructuredData({
          name: "ZS — Music, Data & Interactive Systems",
          description:
            "A creative music technology site featuring interactive rhythm and harmony systems, analytics dashboards, and sound design tools.",
          canonicalPath: "/",
          educationalUse: ["music technology", "composition", "data analysis"],
        })}
      />
      <Navbar />
      <main>
        <Hero />

        <Suspense fallback={<SectionFallback id="services" className="bg-background" />}>
          <Services />
        </Suspense>

        <SystemsPreview />
        <AnalyticsPreview />

        <Suspense fallback={<SectionFallback id="audio" className="bg-secondary/50" />}>
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
