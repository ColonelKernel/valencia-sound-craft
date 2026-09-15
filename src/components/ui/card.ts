import { cn } from "@/lib/utils";

/**
 * The one card shape on this site.
 *
 * Before this, page surfaces split into two unrelated looks — `rounded-sm`
 * (2px) hairline boxes on the homepage and CV, `rounded-[1.5rem]` boxes with a
 * one-off drop shadow on /projects and /tools — and the homepage changed
 * between them twice in a single scroll. This is the 1.5rem shape, which was
 * already the more common of the two.
 *
 * A class function rather than a component on purpose: the call sites are
 * <div>, <article>, <section> and <dl>, and several are pinned by Playwright
 * selectors. Swapping classes cannot change the DOM.
 */
export interface CardOptions {
  /** `none` when the card lays out its own children (grids, dividers, media). */
  padding?: "none" | "sm" | "md";
  /** Lifts the border on hover — for cards that are, or contain, a link. */
  interactive?: boolean;
  /** Clips flush children, e.g. an embed facade that bleeds to the edge. */
  flush?: boolean;
  /** Deeper elevation for a card that sits above the page rather than in it. */
  raised?: boolean;
}

const PADDING = {
  none: "",
  sm: "p-5",
  md: "p-6 md:p-8",
} as const;

export function cardClasses(
  { padding = "sm", interactive = false, flush = false, raised = false }: CardOptions = {},
  ...extra: Array<string | undefined | false>
): string {
  return cn(
    "rounded-card border border-border/70 bg-card/75",
    raised ? "shadow-card-lg" : "shadow-card",
    PADDING[padding],
    interactive && "transition-colors hover:border-foreground/25",
    flush && "overflow-hidden",
    ...extra,
  );
}
