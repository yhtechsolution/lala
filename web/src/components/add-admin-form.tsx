/** Form for creating another administrator. Only existing admins can reach this page,
 * and the security rules refuse the final write for anyone else. */
import { useState } from "react";
import { createAdminAccount, generatePassword, MIN_ADMIN_PASSWORD_LENGTH } from "@/lib/admin-users";
import { firebaseError } from "@/lib/firebase";

export function AddAdminForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await createAdminAccount({
        email: String(data.get("email") || ""),
        displayName: String(data.get("displayName") || ""),
        password,
        sendReset: data.get("sendReset") === "on",
      });
      setMessage(
        result.reusedExisting
          ? "That account already existed and now has admin access."
          : result.resetEmailSent
            ? "Administrator created. A password reset link was emailed so they can choose their own password."
            : "Administrator created. Share the temporary password with them securely; it is not stored anywhere.",
      );
      form.reset();
      setPassword("");
      setShowPassword(false);
    } catch (failure) {
      setError(firebaseError(failure));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="bg-card border rounded-xl p-6 mb-6 space-y-4">
      <h2 className="text-2xl">Add an administrator</h2>
      <p className="text-sm text-muted-foreground">
        Creates a login and gives it full admin access to this portal. You stay signed in.
      </p>
      <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2 disabled:opacity-60">
        <label className="text-sm space-y-1">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="off"
            className="block w-full rounded-md border p-2 bg-background"
          />
        </label>
        <label className="text-sm space-y-1">
          Display name
          <input
            name="displayName"
            required
            maxLength={80}
            className="block w-full rounded-md border p-2 bg-background"
          />
        </label>
        <div className="sm:col-span-2 space-y-2">
          <label className="text-sm space-y-1 block">
            Temporary password
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={MIN_ADMIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="block w-full rounded-md border p-2 bg-background"
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setPassword(generatePassword());
                setShowPassword(true);
              }}
              className="border rounded-md px-3 py-1 text-sm"
            >
              Generate password
            </button>
            <button
              type="button"
              onClick={() => setShowPassword((shown) => !shown)}
              className="border rounded-md px-3 py-1 text-sm"
            >
              {showPassword ? "Hide password" : "Show password"}
            </button>
          </div>
        </div>
        <label className="sm:col-span-2 text-sm flex items-center gap-2">
          <input name="sendReset" type="checkbox" defaultChecked />
          Email them a link to choose their own password
        </label>
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm text-green-800">
          {message}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="bg-primary text-primary-foreground rounded-md px-5 py-2"
      >
        {busy ? "Creating…" : "Create administrator"}
      </button>
    </form>
  );
}
