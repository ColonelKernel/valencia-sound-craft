import { Suspense } from "react";
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <RouteErrorBoundary key={location.pathname}>
        <Suspense fallback={routeFallback}>
          <Outlet />
        </Suspense>
      </RouteErrorBoundary>
      <Footer />
    </div>
  );
};

export default Layout;
