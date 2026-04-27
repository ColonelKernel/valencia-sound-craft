import { useState, FormEvent } from "react";
import { useFadeIn } from "@/hooks/useFadeIn";
import { useLanguage } from "@/i18n/site";
import { Send } from "lucide-react";

const Contact = () => {
  const ref = useFadeIn();
  const { t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="contact" className="section-padding bg-background" ref={ref}>
      <div className="container mx-auto max-w-2xl">
        <div className="fade-up text-center mb-12">
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">{t("contact.eyebrow")}</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{t("contact.title")}</h2>
          <p className="text-muted-foreground">
            {t("contact.copy")}
          </p>
        </div>

        {submitted ? (
          <div className="fade-up text-center py-16 border border-border rounded-lg">
            <p className="text-xl font-display font-semibold mb-2">{t("contact.thanks")}</p>
            <p className="text-muted-foreground text-sm">{t("contact.sent")}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="fade-up space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">{t("contact.name")}</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  className="w-full border border-border bg-background px-4 py-3 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-shadow"
                  placeholder={t("contact.namePlaceholder")}
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">{t("contact.email")}</label>
                <input
                  type="email"
                  required
                  maxLength={255}
                  className="w-full border border-border bg-background px-4 py-3 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-shadow"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                {t("contact.projectType")}
              </label>
              <select
                required
                className="w-full border border-border bg-background px-4 py-3 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-shadow appearance-none"
              >
                <option value="">{t("contact.selectProject")}</option>
                <option>{t("contact.technical")}</option>
                <option>{t("contact.data")}</option>
                <option>{t("contact.musicTech")}</option>
                <option>{t("contact.audio")}</option>
                <option>{t("contact.other")}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">{t("contact.message")}</label>
              <textarea
                required
                maxLength={1000}
                rows={5}
                className="w-full border border-border bg-background px-4 py-3 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-shadow resize-none"
                placeholder={t("contact.messagePlaceholder")}
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 bg-foreground text-background px-6 py-3.5 text-sm font-medium rounded-lg hover:bg-foreground/90 transition-colors"
            >
              {t("contact.title")} <Send size={15} />
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

export default Contact;
