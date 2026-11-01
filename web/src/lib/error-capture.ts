/**
 * Server diagnostics helper with an intentional module-level side effect:
 * importing it wraps console.error and registers available global error listeners.
 * Only the latest captured error is retained, briefly, to recover SSR diagnostics.
 * This is process-wide capture, not a per-request queue.
 */
// Captures the original Error out-of-band so server.ts can recover the stack
// when h3 has already swallowed the throw into a generic 500 Response.

/** Latest recorded error and capture time, shared by this module rather than associated with a request ID. */
let lastCapturedError: { error: unknown; at: number } | undefined;
/** Five-second lifetime for a recorded error so old failures are not reused indefinitely. */
const TTL_MS = 5_000;

/** Stores the newest error together with its capture timestamp, replacing any previous entry. */
function record(error: unknown) {
  lastCapturedError = { error, at: Date.now() };
}

// h3's HTTPError serializes to {"status":500,"unhandled":true,"message":"HTTPError"} —
// no stack, no cause — so a plain console.error(error) reaches the log pipeline with
// the failure detail stripped. Expand Error-like args into a string that keeps the
// message, stack, and the full cause chain.
/** Bounds cause-chain traversal, including cycles, to five iterations. */
const CAUSE_DEPTH_LIMIT = 5;
/** Caps the expanded log description at 8,000 characters. */
const DESCRIPTION_LENGTH_LIMIT = 8_000;

/** Builds a readable stack/cause description for Error instances and safe text for other thrown values. */
export function describeError(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; depth < CAUSE_DEPTH_LIMIT && current != null; depth++) {
    if (!(current instanceof Error)) {
      parts.push(typeof current === "string" ? current : safeStringify(current));
      break;
    }
    const label = depth === 0 ? "" : "caused by: ";
    const status = describeStatus(current);
    parts.push(`${label}${current.stack ?? `${current.name}: ${current.message}`}${status}`);
    /* Follow nested causes until the loop limit or an absent cause ends traversal. */
    current = current.cause;
  }
  return parts.join("\n").slice(0, DESCRIPTION_LENGTH_LIMIT);
}

/** Adds a numeric status/statusCode suffix when an error carries an HTTP status. */
function describeStatus(error: Error): string {
  const { status, statusCode } = error as { status?: unknown; statusCode?: unknown };
  const value = status ?? statusCode;
  return typeof value === "number" ? ` (status ${value})` : "";
}

/** Attempts JSON serialization and falls back to String for circular or otherwise unserializable values. */
function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

/** Type guard used to decide which console.error arguments need capture and expanded formatting. */
function isErrorLike(value: unknown): value is Error {
  return value instanceof Error;
}

// Wrap console.error so errors logged by any layer — including h3's internal
// unhandled-error logging, which this file cannot hook directly — are both
// recorded for consumeLastCapturedError and expanded before serialization.
/** Bound original logger retained before patching console.error; avoids recursive calls to the wrapper. */
const originalConsoleError = console.error.bind(console);
/* Capture only actual Error arguments; leave other logged values unchanged and call the original logger. */
console.error = (...args: unknown[]) => {
  const expanded = args.map((arg) => {
    if (!isErrorLike(arg)) return arg;
    record(arg);
    return describeError(arg);
  });
  originalConsoleError(...expanded);
};

if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => record((event as ErrorEvent).error ?? event));
  globalThis.addEventListener("unhandledrejection", (event) =>
    record((event as PromiseRejectionEvent).reason),
  );
}

/** Returns and clears a recent captured error, or clears/ignores an expired record. */
export function consumeLastCapturedError(): unknown {
  if (!lastCapturedError) return undefined;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = undefined;
    return undefined;
  }
  const { error } = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}
