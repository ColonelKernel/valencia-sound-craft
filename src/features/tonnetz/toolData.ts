import type { RouteMetaConfig } from "@/components/seo/RouteHead";
import { ROUTE_META } from "@/app/routeMeta";
import { TONNETZ_JSONLD } from "@/app/routeStructuredData";

export const tonnetzToolMeta: RouteMetaConfig = {
  ...ROUTE_META.tonnetz,
  canonicalPath: ROUTE_META.tonnetz.path,
  jsonLd: TONNETZ_JSONLD,
};

