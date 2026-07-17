import { Suspense, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

import RouteErrorBoundary from "./RouteErrorBoundary";

const routeFallback = (
  <div className="min-h-screen bg-background pt-24">
    <div className="container mx-auto px-6 py-10 text-sm text-muted-foreground">Loading route…</div>
  </div>
);

/**
 * The single application shell: Navbar and Footer render exactly once here,
 * and every route renders inside a per-route error boundary (keyed by
 * pathname so navigation always remounts a clean subtree).
 */
const Layout = () => {
  const location = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);

  // react-router keeps the window scroll position on push navigation, so a
  // click from a scrolled subnav would land the next route mid-page with no
  // signal to screen readers that anything changed. Reset scroll and move
  // focus on every pathname change — instantly, because index.css sets
  // scroll-behavior: smooth on the root. Hash locations are left alone so
  // in-page anchors keep working, and the initial load keeps native focus.
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    if (!location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      contentRef.current?.focus({ preventScroll: true });
    }
  }, [location.pathname, location.hash]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div ref={contentRef} tabIndex={-1} className="outline-none">
        <RouteErrorBoundary key={location.pathname}>
          <Suspense fallback={routeFallback}>
            <Outlet />
          </Suspense>
        </RouteErrorBoundary>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
