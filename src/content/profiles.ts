/**
 * Public profile URLs — the one place any of these strings live.
 *
 * This used to sit in content/work.ts, which also holds WORK_EMBEDS and the
 * full Global Pulse track credits. That was fine while only the JSON-LD read
 * it, and stopped being fine the moment Navbar and Footer did: both render in
 * the app shell, so importing work.ts for six URLs pulled every embed
 * description and credit line into the entry chunk of every route. Measured at
 * +1.2 KB gzip on the initial graph before this split.
 *
 * Read by the JSON-LD sameAs, the navbar icon row, the footer, the contact
 * page, and CV_PROFILE.profiles.
 */
export const ARTIST_PROFILES = {
  spotify: "https://open.spotify.com/artist/3np4vEs0UOE5zFEXmFEc9L",
  soundcloud: "https://soundcloud.com/streetcarscandal",
  youtube: "https://www.youtube.com/@ColonelKernel22",
  instagram: "https://www.instagram.com/streetcarscandal/",
  linkedin: "https://www.linkedin.com/in/zscheff/",
  github: "https://github.com/ColonelKernel",
};
