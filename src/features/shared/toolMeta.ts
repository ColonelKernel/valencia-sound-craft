import type { RouteMetaConfig } from "@/components/seo/RouteHead";
import { ROUTE_META, type RouteKey } from "@/app/routeMeta";
import { ROUTE_JSONLD } from "@/app/routeStructuredData";

/**
 * A tool route's <RouteHead> config, built from the route table.
 *
 * Every feature directory had its own toolData.ts holding the same five lines
 * with one word changed — spread ROUTE_META[key], repeat the path as
 * canonicalPath, attach that route's JSON-LD. Four files, one shape.
 *
 * Reading the JSON-LD out of ROUTE_JSONLD rather than importing each constant
 * by name is what makes a single helper possible, and it closes a gap: a route
 * added to ROUTE_META without an entry in ROUTE_JSONLD now simply has no
 * structured data, instead of failing to compile in a file nobody remembered
 * to create.
 */
export function toolMeta(key: RouteKey): RouteMetaConfig {
  return {
    ...ROUTE_META[key],
    canonicalPath: ROUTE_META[key].path,
    jsonLd: ROUTE_JSONLD[key],
  };
}
