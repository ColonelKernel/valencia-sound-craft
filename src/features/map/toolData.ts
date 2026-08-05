import type { RouteMetaConfig } from "@/components/seo/RouteHead";
import { ROUTE_META } from "@/app/routeMeta";
import { MAP_JSONLD } from "@/app/routeStructuredData";

export const mapToolMeta: RouteMetaConfig = {
  ...ROUTE_META.map,
  canonicalPath: ROUTE_META.map.path,
  jsonLd: MAP_JSONLD,
};

