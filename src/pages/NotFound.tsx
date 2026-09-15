import { Link } from "react-router-dom";

import RouteHead from "@/components/seo/RouteHead";
import { ROUTE_META } from "@/app/routeMeta";

const NotFound = () => {
  return (
    <main className="pt-16">
      <RouteHead title={ROUTE_META.notFound.title} description={ROUTE_META.notFound.description} />
      <div className="flex min-h-[60vh] items-center justify-center bg-background px-6">
        <div className="text-center">
          <h1 className="type-h1 mb-4">404</h1>
          <p className="mb-4 text-xl text-muted-foreground">
            Page not found. The page you are looking for does not exist or has moved.
          </p>
          <Link to="/" className="text-primary underline underline-offset-4 hover:text-primary/90">
            Return to Home
          </Link>
        </div>
      </div>
    </main>
  );
};

export default NotFound;
