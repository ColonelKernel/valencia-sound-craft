import type { RouteMetaConfig } from "@/components/seo/RouteHead";
import { ROUTE_META } from "@/app/routeMeta";
import { CIRCLE_JSONLD } from "@/app/routeStructuredData";

export const circleToolMeta: RouteMetaConfig = {
  ...ROUTE_META.circle,
  canonicalPath: ROUTE_META.circle.path,
  jsonLd: CIRCLE_JSONLD,
};

