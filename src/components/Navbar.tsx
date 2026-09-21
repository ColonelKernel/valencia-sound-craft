import { useEffect, useState } from "react";
import {
  BarChart3,
  Disc3,
  Github,
  Linkedin,
  Instagram,
  Menu,
  Music,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";

import { ROUTE_META } from "@/app/routeMeta";
import { ARTIST_PROFILES } from "@/content/profiles";
import { TOOL_NAV_LINKS } from "@/content/tools";
import { cn } from "@/lib/utils";

// "Research" deliberately lives in the footer, not here: it points at the PhD
// application dossier, and a hiring visitor reads a top-level Research tab as
// "this candidate is on his way to a doctorate."
const normalizedHomeLinks = [
  { label: "Home", href: "#hero" },
  { label: "Systems", href: "#evidence" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

/**
 * The route destinations, once.
 *
 * The desktop bar and the mobile sheet each wrote this list out by hand in
 * their own markup — same four destinations, same icons, same order, two
 * copies. Adding or removing one meant editing both and remembering that the
 * second existed; retiring the Groove Atlas meant deleting two nearly
 * identical eight-line blocks.
 *
 * `emphasis` is Analytics, which reads as primary until you are on it.
 * `cta` is the CV, the only bordered item in the bar — for a hiring visitor it
 * is the conversion target, and it used to be the most muted link there.
 */
const ROUTE_LINKS: Array<{
  label: string;
  to: string;
  icon?: LucideIcon;
  emphasis?: boolean;
  cta?: boolean;
}> = [
  { label: "Work", to: ROUTE_META.work.path, icon: Disc3 },
  { label: "Projects", to: ROUTE_META.projects.path, icon: Wrench },
  { label: "Analytics", to: ROUTE_META.musicAnalytics.path, icon: BarChart3, emphasis: true },
  { label: "CV", to: ROUTE_META.cv.path, cta: true },
];

/** The animated underline every non-CTA desktop link carries. */
const Underline = ({ active }: { active: boolean }) => (
  <span
    className={cn(
      "absolute -bottom-0.5 left-0 h-px w-full origin-left bg-current transition-transform duration-200 ease-out",
      active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
    )}
  />
);


/**
 * The icon row, built from the one list of profile URLs.
 *
 * These four were string literals here, four more were literals in Footer.tsx,
 * and one was a literal in Contact.tsx — while ARTIST_PROFILES in content/work.ts
 * already held all six and routeStructuredData.ts was already reading from it.
 * So the JSON-LD sameAs and the visible links could disagree, and did: the
 * Spotify href here carried a "?si=" share token that the canonical URL does
 * not, which is a tracking parameter nobody chose to publish.
 */
const socialLinks = [
  { icon: Github, href: ARTIST_PROFILES.github, label: "GitHub" },
  { icon: Linkedin, href: ARTIST_PROFILES.linkedin, label: "LinkedIn" },
  { icon: Music, href: ARTIST_PROFILES.spotify, label: "Spotify" },
  { icon: Instagram, href: ARTIST_PROFILES.instagram, label: "Instagram" },
];

const Navbar = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeHref, setActiveHref] = useState<string | null>(null);
  const isToolsRoute = location.pathname.startsWith("/tools");
  const isAnalyticsRoute = location.pathname === "/music-analytics";
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
        if (!link.href.startsWith("#")) {
          return;
        }

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

    // rAF-throttle: the scroll handler does layout-forcing offsetTop reads for
    // each section, so coalesce it to at most once per frame.
    let ticking = false;
    let rafId = 0;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      rafId = requestAnimationFrame(() => {
        updateNavigationState();
        ticking = false;
      });
    };

    updateNavigationState();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateNavigationState);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateNavigationState);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isHomePage]);

  // On subpages the section anchors must route back to the homepage first;
  // a bare "#evidence" would only mutate the hash on the current route.
  const resolveHomeHref = (href: string) =>
    href.startsWith("#") && !isHomePage ? `/${href}` : href;

  const renderHomeLinks = () => (
    <>
      {normalizedHomeLinks.map((link) => {
        const isActive = activeHref === link.href;
        return (
          <a
            key={link.href}
            href={resolveHomeHref(link.href)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group relative text-sm font-medium transition-colors px-0.5 py-1.5",
              isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {link.label}
            <Underline active={isActive} />
          </a>
        );
      })}
      {ROUTE_LINKS.map((link) => {
        const active = location.pathname === link.to;

        if (link.cta) {
          return (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border-foreground/40 text-foreground"
                  : "border-border text-foreground hover:border-foreground/40 hover:bg-secondary/60",
              )}
            >
              {link.label}
            </Link>
          );
        }

        return (
          <Link
            key={link.to}
            to={link.to}
            className={cn(
              "group relative inline-flex items-center gap-1.5 text-sm font-medium transition-colors px-0.5 py-1.5",
              active
                ? "text-foreground"
                : link.emphasis
                  ? "text-primary hover:text-primary/80"
                  : "text-muted-foreground hover:text-foreground",
            )}
          >
            {link.icon && <link.icon size={14} />}
            {link.label}
            <Underline active={active} />
          </Link>
        );
      })}
    </>
  );

  const renderToolLinks = () =>
    TOOL_NAV_LINKS.map((link) => (
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
            <Underline active={isActive} />
          </>
        )}
      </NavLink>
    ));

  const renderAnalyticsNav = () => (
    <>
      <Link
        to="/"
        className="group relative text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-0.5 py-1.5"
      >
        Home
      </Link>
      <span className="text-sm font-medium text-foreground px-0.5 py-1.5">Analytics</span>
    </>
  );

  /**
   * The way back out of a subnav.
   *
   * On any /tools* or /music-analytics route this bar replaced the whole site
   * nav with the subnav, so CV, Projects and Work all vanished —
   * and the five tool pages contain no internal link of their own. Six of
   * fourteen routes could not reach the CV except through the wordmark, on a
   * site whose own comment calls the CV the conversion target. The subnav
   * stays; it just no longer traps anyone.
   */
  const renderSubnavEscape = () => (
    <div className="flex items-center gap-5 border-l border-border pl-4">
      <Link to="/projects" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
        Projects
      </Link>
      <Link to="/cv" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
        CV
      </Link>
    </div>
  );

  /** The same escape, in the mobile sheet. @see renderSubnavEscape */
  const renderMobileSubnavEscape = () => (
    <div className="mt-2 space-y-2 border-t border-border pt-3">
      {[{ to: "/projects", label: "Projects" }, { to: "/cv", label: "CV" }].map((link) => (
        <Link
          key={link.to}
          to={link.to}
          onClick={() => setMenuOpen(false)}
          className="block rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
        >
          {link.label}
        </Link>
      ))}
    </div>
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
      <div className="container mx-auto flex h-16 items-center justify-between">
        <Link to="/" className="font-display text-lg font-bold tracking-tight text-foreground">
          ZS
        </Link>

        {/* Desktop nav starts at lg, not md: with this many items plus the
            social icons, 768–1023px was tight enough that the longest link
            wrapped to two lines. That range gets the mobile menu instead. */}
        <div className="hidden items-center gap-6 whitespace-nowrap lg:flex">
          {isToolsRoute
            ? renderToolLinks()
            : isAnalyticsRoute
              ? renderAnalyticsNav()
              : renderHomeLinks()}

          {(isToolsRoute || isAnalyticsRoute) && renderSubnavEscape()}

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
          className="rounded-xl border border-border/70 bg-background/70 p-2 text-foreground lg:hidden"
          aria-expanded={menuOpen}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-b border-border bg-background/96 px-6 pb-6 pt-2 backdrop-blur-xl lg:hidden">
          <div className="space-y-2">
            {isToolsRoute
              ? (
                  <>
                    {TOOL_NAV_LINKS.map((link) => (
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
                    ))}
                    {renderMobileSubnavEscape()}
                  </>
                )
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
                      {renderMobileSubnavEscape()}
                    </>
                  )
                : (
                    <>
                      {normalizedHomeLinks.map((link) => {
                        const isActive = activeHref === link.href;
                        return (
                          <a
                            key={link.href}
                            href={resolveHomeHref(link.href)}
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
                      {ROUTE_LINKS.map((link) => (
                        <Link
                          key={link.to}
                          to={link.to}
                          onClick={() => setMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium hover:bg-secondary/70",
                            link.cta && "border border-border text-foreground",
                            link.emphasis
                              ? "text-primary"
                              : !link.cta && "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {link.icon && <link.icon size={14} />}
                          {link.label}
                        </Link>
                      ))}
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
