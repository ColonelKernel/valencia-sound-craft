const Footer = () => {
  return (
    <footer className="border-t border-border bg-background px-6 py-12">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
        <div className="flex flex-col items-center md:items-start gap-1">
          <span className="font-display font-bold text-foreground">ZS</span>
          <span>Valencia, Spain</span>
        </div>

        {/* Wraps on narrow viewports: five links at gap-6 need ~395px, which
            overflowed a 375px screen and put a horizontal scrollbar on every
            page of the site. */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <a
            href="https://www.linkedin.com/in/zscheff/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            LinkedIn
          </a>
          <a
            href="https://open.spotify.com/artist/3np4vEs0UOE5zFEXmFEc9L?si=65RGI1x2TsSZK57Ip69JOQ"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Spotify
          </a>
          <a
            href="https://soundcloud.com/streetcarscandal"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            SoundCloud
          </a>
          <a
            href="https://www.youtube.com/@ColonelKernel22"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            YouTube
          </a>
          <a
            href="https://www.instagram.com/streetcarscandal/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Instagram
          </a>
        </div>

        <p>© {new Date().getFullYear()} All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
