import { useEffect, useState } from "react";
import { BarChart3, Brain, Instagram, Linkedin, Menu, MessageCircle, Music, Sparkles, X, Youtube } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";

import { cn } from "@/lib/utils";

const normalizedHomeLinks = [
  { label: "Home", href: "#hero" },
  { label: "Services", href: "#services" },
  { label: "Interactive Tools", href: "#systems" },
  { label: "Work", href: "#portfolio" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

const toolLinks = [
  { label: "Overview", to: "/tools", end: true },
  { label: "Rhythm", to: "/tools/rhythm" },
  { label: "Harmony", to: "/tools/harmony" },
  { label: "Map", to: "/tools/map" },
  { label: "Circle", to: "/tools/circle" },
  { label: "Tonnetz", to: "/tools/tonnetz" },
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
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeHref, setActiveHref] = useState<string | null>(null);
  const isToolsRoute = location.pathname.startsWith("/tools");
  const isAnalyticsRoute = location.pathname === "/music-analytics";
  const isMusicIntelligenceRoute = location.pathname === "/music-intelligence";
  const isTransitSynthRoute = location.pathname === "/transit-synth";
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    if (!isHomePage) {
      setScrolled(true);
      setActiveHref(null);
      return;
    }

    const updateNavigationState = () => {
      setScrolled(window.scrollY > 40);

      const scrollPosition = window.scrollY + 140;
      let nextActiveHref: string | null = null;

      normalizedHomeLinks.forEach((link) => {
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
  }, [isHomePage]);

  const renderHomeLinks = () => (
    <>
      {normalizedHomeLinks.map((link) => {
        const isActive = activeHref === link.href;
        return (
          <a
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group relative text-sm font-medium transition-colors px-0.5 py-1.5",
              isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {link.label}
            <span
              className={cn(
                "absolute -bottom-0.5 left-0 h-px w-full origin-left bg-current transition-transform duration-200 ease-out",
                isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
              )}
            />
          </a>
        );
      })}
      <Link
        to="/groove-intelligence"
        className={cn(
          "group relative inline-flex items-center gap-1.5 text-sm font-medium transition-colors px-0.5 py-1.5",
          location.pathname === "/groove-intelligence" ? "text-foreground" : "text-emerald-400 hover:text-emerald-300",
        )}
      >
        <Brain size={14} />
        Groove Lab
        <span
          className={cn(
            "absolute -bottom-0.5 left-0 h-px w-full origin-left bg-current transition-transform duration-200 ease-out",
            location.pathname === "/groove-intelligence" ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
          )}
        />
      </Link>
      <Link
        to="/music-analytics"
        className={cn(
          "group relative inline-flex items-center gap-1.5 text-sm font-medium transition-colors px-0.5 py-1.5",
          isAnalyticsRoute ? "text-foreground" : "text-primary hover:text-primary/80",
        )}
      >
        <BarChart3 size={14} />
        Analytics
        <span
          className={cn(
            "absolute -bottom-0.5 left-0 h-px w-full origin-left bg-current transition-transform duration-200 ease-out",
            isAnalyticsRoute ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
          )}
        />
      </Link>
      <Link
        to="/music-intelligence"
        className={cn(
          "group relative inline-flex items-center gap-1.5 text-sm font-medium transition-colors px-0.5 py-1.5",
          isMusicIntelligenceRoute ? "text-foreground" : "text-emerald-300 hover:text-emerald-200",
        )}
      >
        <Sparkles size={14} />
        AMIE
        <span
          className={cn(
            "absolute -bottom-0.5 left-0 h-px w-full origin-left bg-current transition-transform duration-200 ease-out",
            isMusicIntelligenceRoute ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
          )}
        />
      </Link>
    </>
  );

  const renderToolLinks = () =>
    toolLinks.map((link) => (
      <NavLink
        key={link.to}
        to={link.to}
        end={link.end}
        className={({ isActive }) =>
          cn(
            "group relative text-sm font-medium transition-colors px-0.5 py-1.5",
            isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          )
        }
      >
        {({ isActive }) => (
          <>
            {link.label}
            <span
              className={cn(
                "absolute -bottom-0.5 left-0 h-px w-full origin-left bg-current transition-transform duration-200 ease-out",
                isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
              )}
            />
          </>
        )}
      </NavLink>
    ));

  const renderFeatureNav = (label: string) => (
    <>
      <Link
        to="/"
        className="group relative text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-0.5 py-1.5"
      >
        Home
      </Link>
      <span className="text-sm font-medium text-foreground px-0.5 py-1.5">{label}</span>
    </>
  );

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
        <Link to="/" className="font-display text-lg font-bold tracking-tight text-foreground">
          ZS
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {isToolsRoute
            ? renderToolLinks()
            : isAnalyticsRoute
              ? renderFeatureNav("Analytics")
              : isMusicIntelligenceRoute
                ? renderFeatureNav("AMIE")
                : isTransitSynthRoute
                  ? renderFeatureNav("TransitSynth")
              : renderHomeLinks()}

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
            {isToolsRoute
              ? toolLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "block rounded-2xl px-4 py-3 text-sm font-medium",
                        isActive
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                ))
              : isAnalyticsRoute
                ? (
                    <>
                      <Link
                        to="/"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                      >
                        Home
                      </Link>
                      <div className="block rounded-2xl px-4 py-3 text-sm font-medium bg-secondary text-foreground">
                        Analytics
                      </div>
                    </>
                  )
                : isMusicIntelligenceRoute
                  ? (
                      <>
                        <Link
                          to="/"
                          onClick={() => setMenuOpen(false)}
                          className="block rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                        >
                          Home
                        </Link>
                        <div className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium bg-secondary text-foreground">
                          <Sparkles size={14} />
                          AMIE
                        </div>
                      </>
                    )
                : isTransitSynthRoute
                  ? (
                      <>
                        <Link
                          to="/"
                          onClick={() => setMenuOpen(false)}
                          className="block rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                        >
                          Home
                        </Link>
                        <div className="block rounded-2xl px-4 py-3 text-sm font-medium bg-secondary text-foreground">
                          TransitSynth
                        </div>
                      </>
                    )
                : (
                    <>
                      {normalizedHomeLinks.map((link) => {
                        const isActive = activeHref === link.href;
                        return (
                          <a
                            key={link.href}
                            href={link.href}
                            onClick={() => setMenuOpen(false)}
                            className={cn(
                              "block rounded-2xl px-4 py-3 text-sm font-medium",
                              isActive
                                ? "bg-secondary text-foreground"
                                : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
                            )}
                          >
                            {link.label}
                          </a>
                        );
                      })}
                      <Link
                        to="/groove-intelligence"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-emerald-400 hover:bg-secondary/70"
                      >
                        <Brain size={14} />
                        Groove Lab
                      </Link>
                      <Link
                        to="/music-analytics"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-primary hover:bg-secondary/70"
                      >
                        <BarChart3 size={14} />
                        Analytics
                      </Link>
                      <Link
                        to="/music-intelligence"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-emerald-300 hover:bg-secondary/70"
                      >
                        <Sparkles size={14} />
                        AMIE
                      </Link>
                    </>
                  )}
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
