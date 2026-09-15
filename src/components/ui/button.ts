import { cn } from "@/lib/utils";

/**
 * The one CTA shape on this site.
 *
 * Before this there were six hand-rolled primary buttons across the page
 * surfaces — four radii, three fills, three font weights — for what is a single
 * role. Sharing the radius, size scale and weight is what makes them read as
 * one system.
 *
 * `onImage` and `onImageGhost` exist because the hero sits on a photograph:
 * putting it on `bg-primary` would make it match the page and stop being
 * legible. Everything else about those variants is shared.
 *
 * A class function rather than a component on purpose: the call sites are a mix
 * of <button>, <a> and react-router <Link>, and Playwright pins several of them
 * by accessible name. Swapping classes cannot change the DOM.
 */
export interface ButtonOptions {
  variant?: "primary" | "secondary" | "ghost" | "onImage" | "onImageGhost";
  size?: "sm" | "md" | "lg";
  block?: boolean;
}

const VARIANT = {
  primary: "bg-primary text-primary-foreground shadow-cta hover:bg-primary/90",
  secondary: "border border-border bg-card/70 text-foreground hover:border-foreground/30 hover:bg-accent",
  ghost: "text-foreground hover:bg-accent",
  onImage: "bg-white text-black shadow-cta hover:bg-white/90",
  onImageGhost: "border border-white/25 text-white hover:bg-white/10",
} as const;

const SIZE = {
  sm: "px-4 py-2",
  md: "px-5 py-2.5",
  lg: "px-6 py-3.5",
} as const;

export function buttonClasses(
  { variant = "primary", size = "md", block = false }: ButtonOptions = {},
  ...extra: Array<string | undefined | false>
): string {
  return cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors",
    "disabled:pointer-events-none disabled:opacity-60",
    VARIANT[variant],
    SIZE[size],
    block && "w-full",
    ...extra,
  );
}
