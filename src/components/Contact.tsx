import { useState, useRef, useEffect, FormEvent } from "react";
import { buttonClasses } from "@/components/ui/button";
import { cardClasses } from "@/components/ui/card";
import { useFadeIn } from "@/hooks/useFadeIn";
import { ARTIST_PROFILES } from "@/content/profiles";
import { Send, Loader2 } from "lucide-react";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Baked in at build time. When the deploy has no Supabase env vars, the form
// is a guaranteed dead end — every submit fails after the visitor has already
// typed their message. In that state we lead with the direct channel instead
// of rendering a form we know cannot work. The form returns automatically on
// the first deploy with the env vars set.
const BACKEND_CONFIGURED = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
);

type Status = "idle" | "submitting" | "success" | "error";

// A paused/unreachable backend must not strand the visitor on a disabled
// "Sending..." button — abort the insert and fall through to the error UI.
const SUBMIT_TIMEOUT_MS = 10_000;

// AbortSignal.timeout is Safari 16+ / Chrome 103+ / Firefox 100+, newer than
// the build's own browser floor — older engines get a manual controller so a
// missing static can never turn every submit into an instant error.
const timeoutSignal = (ms: number): AbortSignal => {
  if (typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(new DOMException("Timeout", "TimeoutError")), ms);
  return controller.signal;
};

const Contact = () => {
  const ref = useFadeIn();
  const successRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
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
      const { error } = await supabase
        .from("contact_messages")
        .insert({
          name: trimmedName,
          email: trimmedEmail,
          project_type: projectType || null,
          message: trimmedMessage,
        })
        .abortSignal(timeoutSignal(SUBMIT_TIMEOUT_MS));

      setStatus(error ? "error" : "success");
    } catch {
      // Chunk load failure (offline, blocked) — same visible outcome as an
      // insert error, so the visitor gets the fallback channels.
      setStatus("error");
    }
  };

  useEffect(() => {
    if (status === "success") {
      successRef.current?.focus();
    } else if (status === "error") {
      errorRef.current?.focus();
    }
  }, [status]);

  return (
    <section id="contact" className="section-padding bg-background" ref={ref}>
      <div className="container mx-auto max-w-2xl">
        <div className="fade-up text-center mb-12">
          <p className="eyebrow mb-3">Get in Touch</p>
          <h2 className="type-h1 mb-4">Start a Conversation</h2>
          <p className="text-muted-foreground">
            Tell me about the role, or the project.
          </p>
        </div>

        {!BACKEND_CONFIGURED ? (
          <div className={cardClasses({ padding: "none" }, "fade-up text-center py-16 px-6")}>
            <p className="text-xl font-display font-semibold mb-2">Reach out directly</p>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              The quickest way to reach me right now is{" "}
              <a
                href={ARTIST_PROFILES.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 text-foreground"
              >
                LinkedIn
              </a>
              {" "}— message me there.
            </p>
          </div>
        ) : status === "success" ? (
          <div
            ref={successRef}
            tabIndex={-1}
            role="status"
            aria-live="polite"
            className={cardClasses({ padding: "none" }, "fade-up text-center py-16")}
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
                  className="w-full border border-border bg-background px-4 py-3 text-sm rounded-control focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-shadow"
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
                  className="w-full border border-border bg-background px-4 py-3 text-sm rounded-control focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-shadow"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact-project-type" className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Reason for reaching out
              </label>
              <select
                aria-label="Reason for reaching out"
                id="contact-project-type"
                required
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="w-full border border-border bg-background px-4 py-3 text-sm rounded-control focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-shadow appearance-none"
              >
                {/* These are the first thing a visitor has to classify
                    themselves as, so the list has to contain the reason they
                    actually came. It used to spend two of its five substantive
                    slots on music and offer nothing a research or evaluation
                    lead could pick, on a site aimed at government,
                    multilateral and non-profit hiring. The music collapses to
                    one option; "Data science / ML project" stays verbatim
                    because Contact.test.tsx and contact.spec.ts select it by
                    name. */}
                <option value="">Select one</option>
                <option>Full-time role</option>
                <option>Contract / consulting</option>
                <option>Research or evaluation engagement</option>
                <option>Data science / ML project</option>
                <option>Audio software or production</option>
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
                className="w-full border border-border bg-background px-4 py-3 text-sm rounded-control focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-shadow resize-none"
                placeholder="Tell me about the role or the project…"
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
              <div ref={errorRef} tabIndex={-1} role="alert" className="text-sm text-destructive">
                Something went wrong sending your message. Your message is not lost —{" "}
                <a
                  className="underline underline-offset-2"
                  href={`mailto:zachscheffler@gmail.com?subject=${encodeURIComponent(
                    `Project inquiry${projectType ? ` — ${projectType}` : ""} from ${name.trim()}`,
                  )}&body=${encodeURIComponent(`${message.trim()}\n\n— ${name.trim()} (${email.trim()})`)}`}
                >
                  email it to me directly
                </a>{" "}
                or reach out via{" "}
                <a
                  href={ARTIST_PROFILES.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2"
                >
                  LinkedIn
                </a>
                .
              </div>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              className={buttonClasses({ size: "lg", block: true })}
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
              Open to full-time and contract roles, and to collaborations.
            </p>
          </form>
        )}
      </div>
    </section>
  );
};

export default Contact;
