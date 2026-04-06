import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Portfolio from "@/components/Portfolio";
import About from "@/components/About";
import DataAnalysis from "@/components/DataAnalysis";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import ModeVisualizer from "@/components/ModeVisualizer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Services />
      <Contact />
      <Portfolio />
      <ModeVisualizer />
      <About />
      <DataAnalysis />
      <Footer />
    </div>
  );
};

export default Index;
