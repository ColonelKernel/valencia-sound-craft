import { useEffect, useState } from "react";

const sectionLinks = [
  { label: "Research", href: "#research" },
  { label: "Projects", href: "#projects" },
  { label: "Background", href: "#background" },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  return (
    <header className="site-header">
      <nav className="site-nav page-shell" aria-label="Primary navigation">
        <a className="wordmark" href="#top">
          ZS<span aria-hidden="true">/</span>Research
        </a>

        <div className="desktop-nav">
          {sectionLinks.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
          <span className="nav-divider" aria-hidden="true" />
          <a href="https://github.com/ColonelKernel" target="_blank" rel="noreferrer">
            GitHub <span aria-hidden="true">↗</span>
          </a>
          <a href="https://www.linkedin.com/in/zscheff/" target="_blank" rel="noreferrer">
            LinkedIn <span aria-hidden="true">↗</span>
          </a>
        </div>

        <button
          className="menu-button"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
        </button>
      </nav>

      <div id="mobile-navigation" className={`mobile-nav ${menuOpen ? "is-open" : ""}`} hidden={!menuOpen}>
        <div className="page-shell">
          {[...sectionLinks, { label: "GitHub ↗", href: "https://github.com/ColonelKernel" }, { label: "LinkedIn ↗", href: "https://www.linkedin.com/in/zscheff/" }].map(
            (link) => {
              const external = link.href.startsWith("http");
              return (
                <a
                  key={link.href}
                  href={link.href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noreferrer" : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </a>
              );
            },
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
