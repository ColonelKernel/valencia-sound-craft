import { useEffect, useState } from "react";
import { Linkedin, Instagram, Menu, MessageCircle, Music, X, Youtube } from "lucide-react";

import { cn } from "@/lib/utils";

const links = [
  { label: "Systems", href: "#mode-visualizer" },
  { label: "Work", href: "#portfolio" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

const socialLinks = [
  { icon: Linkedin, href: "https://www.linkedin.com/in/zscheff/", label: "LinkedIn" },
  {
    icon: Music,
    href: "https://open.spotify.com/artist/3np4vEs0UOE5zFEXmFEc9L?si=65RGI1x2TsSZK57Ip69JOQ",
    label: "Spotify",
  },
  { icon: Instagram, href: "https://www.instagram.com/streetcarscandal/", label: "Instagram" },
  { icon: Youtube, href: "https://youtube.com", label: "YouTube" },
  { icon: MessageCircle, href: "https://wa.me/15104356431", label: "WhatsApp" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeHref, setActiveHref] = useState<string | null>(null);

  useEffect(() => {
    const updateNavigationState = () => {
      setScrolled(window.scrollY > 40);

      const scrollPosition = window.scrollY + 140;
      let nextActiveHref: string | null = null;

      links.forEach((link) => {
        const section = document.querySelector(link.href);

        if (!section) {
          return;
        }

        if (scrollPosition >= (section as HTMLElement).offsetTop) {
          nextActiveHref = link.href;
        }
      });

      setActiveHref(nextActiveHref);
    };

    updateNavigationState();
    window.addEventListener("scroll", updateNavigationState, { passive: true });
    window.addEventListener("resize", updateNavigationState);

    return () => {
      window.removeEventListener("scroll", updateNavigationState);
      window.removeEventListener("resize", updateNavigationState);
    };
  }, []);

  return (
    <nav
      className={cn(
        "fixed left-0 right-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-200 ease-out",
        scrolled
          ? "border-b border-border bg-background/88 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <a href="#hero" className="font-display text-lg font-bold tracking-tight text-foreground">
          ZS
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link, index) => {
            const isPrimary = index === 0;
            const isActive = activeHref === link.href;

            return (
              <a
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group relative text-sm font-medium transition-colors",
                  isPrimary
                    ? "rounded-full border border-border/70 bg-secondary/35 px-3 py-1.5"
                    : "px-0.5 py-1.5",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {link.label}
                <span
                  className={cn(
                    "absolute bottom-0 left-0 h-px w-full origin-left bg-current transition-transform duration-200 ease-out",
                    isPrimary ? "bottom-[0.4rem]" : "-bottom-0.5",
                    isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                  )}
                />
              </a>
            );
          })}

          <div className="ml-2 flex items-center gap-3 border-l border-border pl-4">
            {socialLinks.map((socialLink) => (
              <a
                key={socialLink.label}
                href={socialLink.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
                aria-label={socialLink.label}
              >
                <socialLink.icon size={16} />
              </a>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          className="rounded-xl border border-border/70 bg-background/70 p-2 text-foreground md:hidden"
          aria-expanded={menuOpen}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-b border-border bg-background/96 px-6 pb-6 pt-2 backdrop-blur-xl md:hidden">
          <div className="space-y-2">
            {links.map((link, index) => {
              const isActive = activeHref === link.href;
              const isPrimary = index === 0;

              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "block rounded-2xl px-4 py-3 text-sm font-medium",
                    isPrimary && "border border-border/70",
                    isActive
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
                  )}
                >
                  {link.label}
                </a>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-4 border-t border-border pt-4">
            {socialLinks.map((socialLink) => (
              <a
                key={socialLink.label}
                href={socialLink.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
                aria-label={socialLink.label}
              >
                <socialLink.icon size={18} />
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
