import { useEffect } from "react";

export interface RouteStructuredData {
  "@context": "https://schema.org";
  "@type": string;
  name: string;
  description: string;
  applicationCategory?: string;
  educationalUse?: string | string[];
  url?: string;
}

export interface RouteMetaConfig {
  title: string;
  description: string;
  /** Omit on pages that must not declare a canonical URL (e.g. the 404). */
  canonicalPath?: string;
  ogImage?: string;
  jsonLd?: RouteStructuredData;
}

function upsertMeta(selector: string, attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }

  element.setAttribute("href", href);
}

function resolveUrl(path: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://example.com";
  return new URL(path, origin).toString();
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

const RouteHead = ({ title, description, canonicalPath, ogImage, jsonLd }: RouteMetaConfig) => {
  useEffect(() => {
    document.title = title;
    upsertMeta('meta[name="description"]', "name", "description", description);
    upsertMeta('meta[property="og:title"]', "property", "og:title", title);
    upsertMeta('meta[property="og:description"]', "property", "og:description", description);
    upsertMeta('meta[property="og:type"]', "property", "og:type", "website");
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", description);

    if (canonicalPath) {
      const canonicalUrl = resolveUrl(canonicalPath);
      upsertMeta('meta[property="og:url"]', "property", "og:url", canonicalUrl);
      upsertLink("canonical", canonicalUrl);
    } else {
      // A page without a canonical (the 404) must not inherit the previous
      // route's canonical link.
      document.head.querySelector('link[rel="canonical"]')?.remove();
    }

    if (ogImage) {
      upsertMeta('meta[property="og:image"]', "property", "og:image", resolveUrl(ogImage));
      upsertMeta('meta[name="twitter:image"]', "name", "twitter:image", resolveUrl(ogImage));
      upsertMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    }

    const scriptId = "route-jsonld";
    const previous = document.getElementById(scriptId);

    if (previous) {
      previous.remove();
    }

    if (jsonLd) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      script.textContent = JSON.stringify({
        ...jsonLd,
        url: resolveUrl(jsonLd.url ?? canonicalPath ?? "/"),
      });
      document.head.appendChild(script);
    }

    return () => {
      const current = document.getElementById(scriptId);
      if (current) {
        current.remove();
      }
    };
  }, [canonicalPath, description, jsonLd, ogImage, title]);

  return null;
};

export default RouteHead;

