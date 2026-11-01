/** Session tests: authentication alone must not grant admin access. */
import { act, cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const callbacks = vi.hoisted(() => ({
  auth: null as null | ((user: unknown) => void),
  membership: null as null | ((doc: unknown) => void),
  failure: null as null | ((error: unknown) => void),
  stopAuth: vi.fn(),
  stopMembership: vi.fn(),
}));
vi.mock("firebase/auth", () => ({
  onAuthStateChanged: (_: unknown, callback: (user: unknown) => void) => {
    callbacks.auth = callback;
    return callbacks.stopAuth;
  },
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  setPersistence: vi.fn(),
  browserLocalPersistence: "local",
  browserSessionPersistence: "session",
}));
vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  onSnapshot: (_: unknown, callback: (doc: unknown) => void, failure: (error: unknown) => void) => {
    callbacks.membership = callback;
    callbacks.failure = failure;
    return callbacks.stopMembership;
  },
}));
vi.mock("@/lib/firebase", () => ({
  getFirebase: () => ({ auth: {}, db: {} }),
  firebaseError: () => "Permission denied",
}));
import { setPersistence, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { AdminAuthProvider, useAdmin } from "@/lib/admin-auth";
function Probe() {
  const session = useAdmin();
  return (
    <>
      <button onClick={() => void session.login("admin@example.com", "password", false)}>
        Session login
      </button>
      <button onClick={() => void session.login("admin@example.com", "password", true)}>
        Remember login
      </button>
      <button onClick={() => void session.logout()}>Logout</button>
      <p>{!session.ready ? "checking" : session.isAdmin ? "allowed" : "denied"}</p>
    </>
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  callbacks.auth = null;
  callbacks.membership = null;
  callbacks.failure = null;
  localStorage.setItem("lala_admin_session", "active");
});
afterEach(() => {
  cleanup();
  localStorage.clear();
});
function setup() {
  render(
    <AdminAuthProvider>
      <Probe />
    </AdminAuthProvider>,
  );
}
describe("Admin membership", () => {
  it("does not trust the old localStorage demo flag", () => {
    setup();
    expect(screen.getByText("checking")).toBeInTheDocument();
    act(() => callbacks.auth?.(null));
    expect(screen.getByText("denied")).toBeInTheDocument();
  });
  it("denies authenticated accounts with no admin document", () => {
    setup();
    act(() => callbacks.auth?.({ uid: "customer-1", email: "customer@example.com" }));
    act(() => callbacks.membership?.({ exists: () => false, data: () => undefined }));
    expect(screen.getByText("denied")).toBeInTheDocument();
  });
  it("grants access only after membership is confirmed and closes it if membership is revoked", () => {
    setup();
    act(() => callbacks.auth?.({ uid: "admin-1" }));
    act(() =>
      callbacks.membership?.({ exists: () => true, data: () => ({ displayName: "Admin" }) }),
    );
    expect(screen.getByText("allowed")).toBeInTheDocument();
    act(() => callbacks.membership?.({ exists: () => false, data: () => undefined }));
    expect(screen.getByText("denied")).toBeInTheDocument();
  });
  it("fails closed when the membership lookup is denied", () => {
    setup();
    act(() => callbacks.auth?.({ uid: "user-1" }));
    act(() => callbacks.failure?.({ code: "permission-denied" }));
    expect(screen.getByText("denied")).toBeInTheDocument();
  });
});

describe("Session choices", () => {
  it("sets tab-session persistence before signing in", async () => {
    setup();
    fireEvent.click(screen.getByText("Session login"));
    await waitFor(() => expect(signInWithEmailAndPassword).toHaveBeenCalled());
    expect(setPersistence).toHaveBeenCalledWith(expect.anything(), "session");
    expect(vi.mocked(setPersistence).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(signInWithEmailAndPassword).mock.invocationCallOrder[0]!,
    );
  });
  it("uses local persistence only when Remember me is selected", async () => {
    setup();
    fireEvent.click(screen.getByText("Remember login"));
    await waitFor(() => expect(setPersistence).toHaveBeenCalledWith(expect.anything(), "local"));
  });
  it("uses Firebase sign-out", async () => {
    setup();
    fireEvent.click(screen.getByText("Logout"));
    await waitFor(() => expect(signOut).toHaveBeenCalled());
  });
});
