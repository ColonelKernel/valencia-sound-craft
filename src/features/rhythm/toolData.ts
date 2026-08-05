import type { RouteMetaConfig } from "@/components/seo/RouteHead";
import { ROUTE_META } from "@/app/routeMeta";
import { RHYTHM_JSONLD } from "@/app/routeStructuredData";

export const rhythmToolMeta: RouteMetaConfig = {
  ...ROUTE_META.rhythm,
  canonicalPath: ROUTE_META.rhythm.path,
  jsonLd: RHYTHM_JSONLD,
};

