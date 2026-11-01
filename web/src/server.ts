/**
 * Server request entry. Lazily loads TanStack Start, forwards each request, and
 * replaces catastrophic SSR failures with a standalone HTML fallback. Ordinary
 * responses pass through. The side-effect error-capture import must run first.
 */
import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

/** Minimal fetch-handler contract expected from the dynamically imported TanStack server entry. */
type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

/** Caches the import promise so requests share one server-entry load rather than repeatedly importing it. */
let serverEntryPromise: Promise<ServerEntry> | undefined;

/** Lazily imports the framework handler and accepts either its default export or module namespace. */
async function getServerEntry(): Promise<ServerEntry> {
  /* Cache the first import promise, including its resolved handler, across requests. */
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
/** Only replaces 5xx JSON responses matching the swallowed h3 error shape; clones the body before inspection. */
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  /* Clone before reading so pass-through responses retain their original unconsumed body. */
  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

/** Parses the response defensively and matches unhandled HTTPError payloads; non-JSON is not a match. */
function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      /* Pass Request, environment, and execution context unchanged to the framework fetch handler. */
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
