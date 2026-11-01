import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeading } from "@/components/portal-shell";
import { useAdmin } from "@/lib/admin-auth";
import { changePassword, saveDisplayName } from "@/lib/account";
import { firebaseError } from "@/lib/firebase";
export const Route = createFileRoute("/account")({ component: Account });
function Account() {
  const { user, displayName, logout } = useAdmin();
  const [name, setName] = useState(displayName);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function run(action: () => Promise<void>, success: string) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      setMessage(success);
    } catch (e) {
      setError(firebaseError(e));
    } finally {
      setBusy(false);
    }
  }
  const input = "mt-2 block w-full rounded-md border bg-background p-3";
  return (
    <>
      <PageHeading
        eyebrow="Account & security"
        title="My account"
        description="Manage your administrator profile and password."
      />
      {message && (
        <p role="status" className="mb-4 rounded-lg bg-green-50 p-4 text-green-900">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">
          {error}
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-6">
          <h2 className="text-xl font-semibold">Profile</h2>
          <p className="my-3">{user?.email}</p>
          <p className="mb-5 text-sm text-muted-foreground">
            Administrator · Email {user?.emailVerified ? "verified" : "not verified"}
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(() => saveDisplayName(name), "Display name saved.");
            }}
          >
            <label>
              Display name
              <input
                className={input}
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <button
              disabled={busy}
              className="mt-4 rounded bg-primary px-4 py-2 text-primary-foreground"
            >
              Save profile
            </button>
          </form>
        </section>
        <section className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Change password</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                await changePassword(current, next, confirm);
                setCurrent("");
                setNext("");
                setConfirm("");
              }, "Password changed successfully.");
            }}
          >
            <label>
              Current password
              <input
                type="password"
                autoComplete="current-password"
                required
                className={input}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </label>
            <label className="mt-4 block">
              New password
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className={input}
                value={next}
                onChange={(e) => setNext(e.target.value)}
              />
            </label>
            <label className="mt-4 block">
              Confirm new password
              <input
                type="password"
                autoComplete="new-password"
                required
                className={input}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </label>
            <button
              disabled={busy}
              className="mt-4 rounded bg-primary px-4 py-2 text-primary-foreground"
            >
              Update password
            </button>
          </form>
        </section>
        <section className="rounded-xl border bg-card p-6">
          <h2 className="text-xl font-semibold">This session</h2>
          <p className="my-3 text-sm">
            Remember me is selected at sign-in. Signing out clears this application's Firebase
            session on this device; it does not sign out other devices.
          </p>
          <button
            disabled={busy}
            onClick={() => void run(logout, "Signed out.")}
            className="underline"
          >
            Sign out of this device
          </button>
        </section>
      </div>
    </>
  );
}
