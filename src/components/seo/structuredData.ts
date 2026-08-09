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
}) {
  return {
    "@context": "https://schema.org" as const,
    "@type": "Person",
    name: config.name,
    jobTitle: config.jobTitle,
    description: config.description,
    sameAs: config.sameAs,
    url: "/",
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
