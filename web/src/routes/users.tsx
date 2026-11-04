/** Two sections: the administrators (an existing admin can add another, see lib/admin-users.ts)
 * and the listing creators inferred from each guesthouse's createdBy field.
 * Customer profiles stay private under the security rules. Removing or suspending admins
 * is not offered here because it needs a trusted backend. */
import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { collection, onSnapshot } from "firebase/firestore";
import { AddAdminForm } from "@/components/add-admin-form";
import { PageHeading } from "@/components/portal-shell";
import { getFirebase, firebaseError } from "@/lib/firebase";
import { useGuesthouses } from "@/lib/live-guesthouses";
import { statusOf, STATUS_LABELS } from "@/lib/guesthouses";
export const Route = createFileRoute("/users")({ component: UsersPage });
function UsersPage() {
  return (
    <>
      <AdminDirectory />
      <ListingCreators />
    </>
  );
}
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
        title="Users"
        description="Administrators have access to this portal. Add a colleague below."
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

type Lister = { uid: string; listings: ReturnType<typeof useGuesthouses>["items"] };
/** Groups guesthouses by their createdBy UID. createdBy is the admin who created the listing;
 * it does not prove who owns or runs the guesthouse, and names or emails are not available
 * from it. A full customer directory needs an approved profile schema or a Cloud Function. */
function ListingCreators() {
  const { items, loading, error } = useGuesthouses();
  const [query, setQuery] = useState("");
  const listers = useMemo(() => {
    const grouped = new Map<string, Lister>();
    for (const listing of items) {
      const uid = String(listing.createdBy || "").trim();
      if (!uid) continue;
      const existing = grouped.get(uid) || { uid, listings: [] };
      existing.listings.push(listing);
      grouped.set(uid, existing);
    }
    return [...grouped.values()].sort((a, b) => a.uid.localeCompare(b.uid));
  }, [items]);
  const visible = listers.filter((lister) =>
    `${lister.uid} ${lister.listings.map((listing) => `${listing.name} ${listing.city}`).join(" ")}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  return (
    <section className="mt-10" aria-label="Listing creators">
      <h2 className="text-2xl mb-2">Listing creators</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Creator records inferred from guesthouse metadata; this is not a verified lister or
        customer account directory.
      </p>
      <section className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
        <h3 className="font-semibold">A full end-user directory requires a backend addition</h3>
        <p className="mt-2">
          The current Firebase setup has no admin-readable customer profile collection and no
          trusted Firebase Authentication user directory, so this page does not invent customer
          records. The records below group guesthouses by their createdBy UID, which identifies
          the admin who created a listing, not who owns or operates the guesthouse.
        </p>
        <p className="mt-2">
          To complete the directory, the backend team must provide an approved user profile schema
          with matching Firestore rules, or a secured Cloud Function using the Firebase Admin SDK.
        </p>
      </section>
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Listing creator UIDs identified</p>
          <p className="mt-1 text-2xl font-semibold">{loading ? "—" : listers.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Guesthouses in their portfolios</p>
          <p className="mt-1 text-2xl font-semibold">{loading ? "—" : items.length}</p>
        </div>
      </div>
      <label className="mb-5 block text-sm">
        Search creator UID, guesthouse or city
        <input
          className="mt-2 block w-full rounded-md border bg-card p-3"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search listing creators…"
        />
      </label>
      {loading && <p role="status">Loading listing creator portfolios…</p>}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {!loading && !error && !visible.length && (
        <p className="rounded-xl border bg-card p-5">
          {listers.length
            ? "No listing creators match your search."
            : "No guesthouse creator records are available yet."}
        </p>
      )}
      <div className="space-y-4">
        {visible.map((lister) => (
          <article key={lister.uid} className="rounded-xl border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Listing creator · Auth UID
                </p>
                <h3 className="mt-1 break-all font-mono text-sm font-semibold">{lister.uid}</h3>
              </div>
              <p className="rounded-full bg-secondary px-3 py-1 text-sm">
                {lister.listings.length} {lister.listings.length === 1 ? "listing" : "listings"}
              </p>
            </div>
            <h4 className="mt-5 text-sm font-semibold">Guesthouses created by this account</h4>
            <ul className="mt-2 divide-y">
              {lister.listings.map((listing) => (
                <li
                  key={listing.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                >
                  <span>
                    <span className="font-medium">{listing.name}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {listing.city}, {listing.country}
                    </span>
                  </span>
                  <span
                    className={
                      statusOf(listing) === "published" ? "text-emerald-700" : "text-amber-800"
                    }
                  >
                    {STATUS_LABELS[statusOf(listing)]}
                  </span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
