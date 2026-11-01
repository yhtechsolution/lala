/**
 * Shared jsdom test setup. Adds DOM assertion helpers and mock browser APIs that
 * jsdom does not implement. The matchMedia mock always reports matches: false;
 * these stubs support tests but do not simulate real viewport transitions.
 */
import "@testing-library/jest-dom/vitest";

Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => {},
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
