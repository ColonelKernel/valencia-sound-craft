/**
 * JSON-LD builders for route <head>s.
 *
 * These live outside RouteHead.tsx on purpose: a module that exports both a
 * component and plain helpers defeats React Fast Refresh, so the component
 * stays alone in RouteHead.tsx and the helpers live here.
 */

export interface RouteStructuredData {
  "@context": "https://schema.org";
  "@type": string;
  name: string;
  description: string;
  applicationCategory?: string;
  educationalUse?: string | string[];
  jobTitle?: string;
  sameAs?: string[];
  url?: string;
  /** Article routes (case studies) name their author. */
  author?: { "@type": "Person"; name: string };
  /** The subject an article is about — e.g. the app a case study describes. */
  about?: {
    "@type": string;
    name: string;
    applicationCategory?: string;
    operatingSystem?: string;
    url?: string;
  };
}

/**
 * The homepage is a portfolio, not a tool: it describes a person. Tool
 * routes keep SoftwareApplication via createToolStructuredData below.
 */
export function createPersonStructuredData(config: {
  name: string;
  jobTitle: string;
  description: string;
  sameAs: string[];
  /**
   * The route this Person block describes. Two routes use it — "/" and "/cv" —
   * and this used to be hardcoded to "/", which made /cv the one route whose
   * JSON-LD differed before and after hydration: the build stamped
   * ".../cv" while RouteHead read the hardcoded "/" back out
   * (it takes `jsonLd.url ?? canonicalPath`, and "/" is truthy) and rewrote
   * the tag to ".../". The stamp plugin comments twice that stamped and
   * hydrated payloads cannot diverge; on that one route they did.
   */
  canonicalPath: string;
}) {
  return {
    "@context": "https://schema.org" as const,
    "@type": "Person",
    name: config.name,
    jobTitle: config.jobTitle,
    description: config.description,
    sameAs: config.sameAs,
    url: config.canonicalPath,
  };
}

export function createToolStructuredData(config: {
  name: string;
  description: string;
  canonicalPath: string;
  educationalUse: string | string[];
}) {
  return {
    "@context": "https://schema.org" as const,
    "@type": "SoftwareApplication",
    name: config.name,
    description: config.description,
    applicationCategory: "MusicApplication",
    educationalUse: config.educationalUse,
    url: config.canonicalPath,
  };
}
