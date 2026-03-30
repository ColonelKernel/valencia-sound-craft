import { useState, FormEvent } from "react";
import { useFadeIn } from "@/hooks/useFadeIn";
import { Send } from "lucide-react";

const Contact = () => {
  const ref = useFadeIn();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="contact" className="section-padding bg-background" ref={ref}>
      <div className="container mx-auto max-w-2xl">
        <div className="fade-up text-center mb-12">
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">Get in Touch</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Start a Project</h2>
          <p className="text-muted-foreground">
            Tell me what you're working on — I'll get back to you within 24–48 hours.
          </p>
        </div>

        {submitted ? (
          <div className="fade-up text-center py-16 border border-border rounded-sm">
            <p className="text-xl font-display font-semibold mb-2">Thank you!</p>
            <p className="text-muted-foreground text-sm">Your message has been sent. I'll be in touch soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="fade-up space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Name
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  className="w-full border border-border bg-background px-4 py-3 text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-shadow"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  maxLength={255}
                  className="w-full border border-border bg-background px-4 py-3 text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-shadow"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Project Type
              </label>
              <select
                required
                className="w-full border border-border bg-background px-4 py-3 text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-shadow appearance-none"
              >
                <option value="">Select a project type</option>
                <option>Guitar Lessons</option>
                <option>Mixing</option>
                <option>Production</option>
                <option>Video / Live Session</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Message
              </label>
              <textarea
                required
                maxLength={1000}
                rows={5}
                className="w-full border border-border bg-background px-4 py-3 text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-shadow resize-none"
                placeholder="Tell me about your project..."
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 bg-foreground text-background px-6 py-3.5 text-sm font-medium rounded-sm hover:bg-foreground/90 transition-colors"
            >
              Send Message <Send size={15} />
            </button>

            <p className="text-center text-xs text-muted-foreground pt-2">
              Open to collaborations, sessions, and new projects.
            </p>
          </form>
        )}
      </div>
    </section>
  );
};

export default Contact;
