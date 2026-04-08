import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";

const TOOL_LINKS = [
  { to: "/tools", label: "Overview", end: true },
  { to: "/tools/rhythm", label: "Rhythm" },
  { to: "/tools/harmony", label: "Harmony" },
  { to: "/tools/map", label: "Map" },
  { to: "/tools/circle", label: "Circle" },
  { to: "/tools/tonnetz", label: "Tonnetz" },
];

const ToolSubnav = () => (
  <nav aria-label="Tool navigation" className="overflow-x-auto pb-1">
    <div className="flex min-w-max items-center gap-2">
      {TOOL_LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) =>
            cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-primary/30 bg-primary/10 text-foreground"
                : "border-border bg-card/70 text-muted-foreground hover:bg-accent hover:text-foreground",
            )
          }
        >
          {link.label}
        </NavLink>
      ))}
    </div>
  </nav>
);

export default ToolSubnav;

