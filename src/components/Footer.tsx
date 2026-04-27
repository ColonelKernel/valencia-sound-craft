import { useLanguage } from "@/i18n/site";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border bg-background px-6 py-12">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
        <div className="flex flex-col items-center md:items-start gap-1">
          <span className="font-display font-bold text-foreground">ZS</span>
          <span className="text-xs text-muted-foreground/60">
            {t("footer.tagline")}
          </span>
        </div>

        <div className="flex items-center gap-6">
          <a href="https://www.linkedin.com/in/zscheff/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">LinkedIn</a>
          <a href="https://open.spotify.com/artist/3np4vEs0UOE5zFEXmFEc9L" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Spotify</a>
          <a href="https://www.instagram.com/streetcarscandal/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Instagram</a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">YouTube</a>
        </div>

        <p>© {new Date().getFullYear()} {t("common.rights")}</p>
      </div>
    </footer>
  );
};

export default Footer;
