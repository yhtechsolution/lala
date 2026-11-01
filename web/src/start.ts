/**
 * TanStack Start middleware setup. Unexpected server errors receive an HTML
 * fallback; statusCode-bearing errors are rethrown. CSRF middleware is explicitly
 * restored for server functions because defining this file replaces the defaults.
 */
import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";

/** Wraps subsequent middleware/request work, preserves statusCode errors, and renders a generic fallback for unexpected throws. */
const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
/** Applies cross-site request protection to server-function handlers selected by handlerType. */
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

/** Registers middleware in array order: outer error handling, then server-function CSRF protection. */
export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware, csrfMiddleware],
}));
