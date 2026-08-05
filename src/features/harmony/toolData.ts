import type { RouteMetaConfig } from "@/components/seo/RouteHead";
import { ROUTE_META } from "@/app/routeMeta";
import { HARMONY_JSONLD } from "@/app/routeStructuredData";

export const harmonyToolMeta: RouteMetaConfig = {
  ...ROUTE_META.harmony,
  canonicalPath: ROUTE_META.harmony.path,
  jsonLd: HARMONY_JSONLD,
};

