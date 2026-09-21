import { ARTIST_PROFILES } from "@/content/profiles";

/**
 * Footer links, from the one list of profile URLs.
 *
 * These were eight hand-written anchors repeating the same six-line <a> with
 * the href and the label changed. Four of the URLs were also literals in
 * Navbar.tsx and one in Contact.tsx, while ARTIST_PROFILES in content/work.ts
 * already held all six and the JSON-LD was already reading from it — so the
 * structured data and the visible links could drift apart, and had: two
 * Spotify hrefs carried a "?si=" share token the canonical URL does not.
 *
 * The research dossier sits here rather than in the primary nav: it is a PhD
 * application surface, and a hiring visitor reads it as "leaving soon" if it
 * appears alongside Work and Projects.
 */
const FOOTER_LINKS: Array<{ label: string; href: string; external?: boolean }> = [
  { label: "Contact", href: "/#contact" },
  { label: "GitHub", href: ARTIST_PROFILES.github, external: true },
  { label: "LinkedIn", href: ARTIST_PROFILES.linkedin, external: true },
  { label: "Spotify", href: ARTIST_PROFILES.spotify, external: true },
  { label: "SoundCloud", href: ARTIST_PROFILES.soundcloud, external: true },
  { label: "YouTube", href: ARTIST_PROFILES.youtube, external: true },
  { label: "Instagram", href: ARTIST_PROFILES.instagram, external: true },
  { label: "Music Research", href: "https://research.zachscheffler.com", external: true },
];

const Footer = () => (
  <footer className="border-t border-border bg-background py-12">
    <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
      <div className="flex flex-col items-center md:items-start gap-1">
        <span className="font-display font-bold text-foreground">ZS</span>
        <span>San Francisco Bay Area</span>
      </div>

      {/* Wraps on narrow viewports: these links at gap-6 need ~395px, which
          overflowed a 375px screen and put a horizontal scrollbar on every
          page of the site. */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {FOOTER_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="hover:text-foreground transition-colors"
          >
            {link.label}
          </a>
        ))}
      </div>

      <p>© {new Date().getFullYear()} All rights reserved.</p>
    </div>
  </footer>
);

export default Footer;
