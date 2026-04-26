import { NavLink } from "react-router-dom";

import { TOOL_NAV_ROUTES } from "@/lib/toolRoutes";
import { cn } from "@/lib/utils";

const ToolSubnav = () => (
  <nav aria-label="Tool navigation" className="overflow-x-auto pb-1">
    <div className="flex min-w-max items-center gap-2">
      {TOOL_NAV_ROUTES.map((link) => (
        <NavLink
          key={link.path}
          to={link.path}
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
