/** Lists administrators and lets an existing admin add another one (see lib/admin-users.ts).
 * Customer profiles stay private under the security rules. Removing or suspending admins
 * is not offered here because it needs a trusted backend. */
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { collection, onSnapshot } from "firebase/firestore";
import { AddAdminForm } from "@/components/add-admin-form";
import { PageHeading } from "@/components/portal-shell";
import { getFirebase, firebaseError } from "@/lib/firebase";
export const Route = createFileRoute("/users")({ component: AdminDirectory });
function AdminDirectory() {
  const [admins, setAdmins] = useState<{ id: string; email: string; displayName: string }[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(
    () =>
      onSnapshot(
        collection(getFirebase().db, "admins"),
        (snapshot) => {
          setAdmins(
            snapshot.docs.map((record) => ({
              id: record.id,
              email: String(record.data()["email"] || ""),
              displayName: String(record.data()["displayName"] || ""),
            })),
          );
          setLoading(false);
        },
        (failure) => {
          setError(firebaseError(failure));
          setLoading(false);
        },
      ),
    [],
  );
  return (
    <>
      <PageHeading
        eyebrow="Access directory"
        title="Administrators"
        description="Everyone with admin access to this portal. Add a colleague below."
      />
      <AddAdminForm />
      {loading && <p role="status">Loading administrators…</p>}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <div className="space-y-3">
        {admins.map((admin) => (
          <article key={admin.id} className="bg-card border p-5 rounded-xl">
            <h2 className="text-xl">{admin.displayName || "Administrator"}</h2>
            <p>{admin.email}</p>
          </article>
        ))}
      </div>
    </>
  );
}
