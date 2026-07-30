import { useState, useRef, useEffect, FormEvent } from "react";
import { useFadeIn } from "@/hooks/useFadeIn";
import { Send, Loader2 } from "lucide-react";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = "idle" | "submitting" | "success" | "error";

const Contact = () => {
  const ref = useFadeIn();
  const successRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [projectType, setProjectType] = useState("");
  const [message, setMessage] = useState("");
  // Honeypot: humans never see or fill this field.
  const [company, setCompany] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      setValidationError("Please fill in your name, email, and message.");
      return;
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setValidationError("Please enter a valid email address.");
      return;
    }

    // Honeypot filled: silently drop, pretend success.
    if (company) {
      setStatus("success");
      return;
    }

    setStatus("submitting");
    try {
      // Loaded on submit: supabase-js is ~45 KB gzip that the homepage
      // otherwise downloads for every visitor, submit or not.
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase.from("contact_messages").insert({
        name: trimmedName,
        email: trimmedEmail,
        project_type: projectType || null,
        message: trimmedMessage,
      });

      setStatus(error ? "error" : "success");
    } catch {
      // Chunk load failure (offline, blocked) — same visible outcome as an
      // insert error, so the visitor gets the mailto fallback message.
      setStatus("error");
    }
  };

  useEffect(() => {
    if (status === "success") {
      successRef.current?.focus();
    }
  }, [status]);

  return (
    <section id="contact" className="section-padding bg-background" ref={ref}>
      <div className="container mx-auto max-w-2xl">
        <div className="fade-up text-center mb-12">
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">Get in Touch</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Start a Project</h2>
          <p className="text-muted-foreground">
            Tell me what you're working on — I'll get back to you within 24–48 hours.
          </p>
        </div>

        {status === "success" ? (
          <div
            ref={successRef}
            tabIndex={-1}
            role="status"
            aria-live="polite"
            className="fade-up text-center py-16 border border-border rounded-sm"
          >
            <p className="text-xl font-display font-semibold mb-2">Thank you!</p>
            <p className="text-muted-foreground text-sm">Your message has been sent. I'll be in touch soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="fade-up space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="contact-name" className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-border bg-background px-4 py-3 text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-shadow"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  maxLength={255}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-border bg-background px-4 py-3 text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-shadow"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact-project-type" className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Project Type
              </label>
              <select
                aria-label="Project Type"
                id="contact-project-type"
                required
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
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
              <label htmlFor="contact-message" className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Message
              </label>
              <textarea
                id="contact-message"
                required
                maxLength={1000}
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full border border-border bg-background px-4 py-3 text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-shadow resize-none"
                placeholder="Tell me about your project..."
              />
            </div>

            {/* Honeypot — hidden from humans, bots tend to fill it. */}
            <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
              <label htmlFor="contact-company">Company</label>
              <input
                id="contact-company"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>

            {validationError && (
              <p className="text-sm text-destructive" role="alert">
                {validationError}
              </p>
            )}

            {status === "error" && (
              <p className="text-sm text-destructive" role="alert">
                Something went wrong sending your message. Please reach out via{" "}
                <a
                  href="https://www.linkedin.com/in/zscheff/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2"
                >
                  LinkedIn
                </a>{" "}
                instead.
              </p>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full inline-flex items-center justify-center gap-2 bg-foreground text-background px-6 py-3.5 text-sm font-medium rounded-sm hover:bg-foreground/90 transition-colors disabled:opacity-60 disabled:pointer-events-none"
            >
              {status === "submitting" ? (
                <>
                  Sending... <Loader2 size={15} className="animate-spin" />
                </>
              ) : (
                <>
                  Send Message <Send size={15} />
                </>
              )}
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
