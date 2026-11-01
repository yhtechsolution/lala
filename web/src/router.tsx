/**
 * Creates the TanStack router and its React Query client. The generated route tree
 * determines which page corresponds to each URL; the query client is passed through
 * route context for RootComponent to supply to descendant components.
 */
import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

/** Creates a fresh query client and router, enables scroll restoration, and sets preload stale time to zero. */
export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
