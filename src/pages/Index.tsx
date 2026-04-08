import { lazy, Suspense, useEffect } from "react";
import { ArrowDown } from "lucide-react";

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ModeVisualizer from "@/components/ModeVisualizer";

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
  useEffect(() => {
    void import("@/components/Blipblox/GlobalRhythmEngine");
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />

      <section className="border-y border-border/70 bg-card/65 px-6 py-5 backdrop-blur-sm">
        <div className="container mx-auto">
          <a
            href="#mode-visualizer"
            className="inline-flex items-center gap-3 rounded-full border border-primary/18 bg-primary/8 px-5 py-3 text-sm font-semibold text-foreground shadow-[0_14px_34px_-26px_rgba(255,255,255,0.25)] hover:bg-primary/12"
          >
            Start by playing with the rhythm engine ↓
            <ArrowDown className="h-4 w-4" />
          </a>
        </div>
      </section>

      <ModeVisualizer />

      <Suspense fallback={<SectionFallback id="services" className="bg-background" />}>
        <Services />
      </Suspense>
      <Suspense fallback={<SectionFallback id="portfolio" className="bg-secondary/50" />}>
        <Portfolio />
      </Suspense>
      <Suspense fallback={<SectionFallback id="about" className="bg-background" />}>
        <About />
      </Suspense>
      <Suspense fallback={<SectionFallback id="contact" className="bg-background" />}>
        <Contact />
      </Suspense>
      <Suspense fallback={<SectionFallback className="bg-background" />}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Index;
