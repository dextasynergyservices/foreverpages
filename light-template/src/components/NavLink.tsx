import { NavLink as RouterNavLink } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "../lib/utils.ts";

// Minimal local props so the template compiles even when react-router-dom types
// are not installed in the worker. This intentionally keeps the shape loose.
interface NavLinkCompatProps {
  to: string | Record<string, unknown>;
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
  [key: string]: any;
}
const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        {...props}
      />
    );
  }
);

NavLink.displayName = "NavLink";

export { NavLink };
