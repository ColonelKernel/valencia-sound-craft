import { useFadeIn } from "@/hooks/useFadeIn";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "Working with Zach was seamless — the final mix exceeded expectations. He truly understood the vision.",
    name: "Marta R.",
    role: "Indie Artist",
  },
  {
    quote: "His guitar playing added a dimension to our tracks we didn't know we needed. Professional and creative.",
    name: "Carlos D.",
    role: "Producer & Songwriter",
  },
  {
    quote: "The live session video was exactly what we needed for promotion. Great audio, great visuals, easy process.",
    name: "Ana G.",
    role: "Band Manager",
  },
];

const SocialProof = () => {
  const ref = useFadeIn();

  return (
    <section className="section-padding bg-foreground" ref={ref}>
      <div className="container mx-auto">
        <div className="fade-up mb-16 text-center">
          <p className="text-xs tracking-widest uppercase text-primary-foreground/40 mb-3">Testimonials</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary-foreground">
            What Artists Say
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className="fade-up border border-primary-foreground/10 rounded-sm p-8"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <Quote size={20} className="text-primary-foreground/20 mb-4" />
              <p className="text-primary-foreground/70 leading-relaxed mb-6 text-sm">
                "{t.quote}"
              </p>
              <div>
                <p className="text-primary-foreground font-display font-semibold text-sm">{t.name}</p>
                <p className="text-primary-foreground/40 text-xs">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
