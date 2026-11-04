/** Live listing directory with schema-compatible create/edit/suspend operations. Listings are
 * never deleted from here: suspending keeps the record, ratings and favourites. */
import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeading } from "@/components/portal-shell";
import { GuesthouseForm } from "@/components/guesthouse-form";
import { useGuesthouses } from "@/lib/live-guesthouses";
import {
  GUESTHOUSE_STATUSES,
  setGuesthouseStatus,
  STATUS_LABELS,
  statusOf,
  type Guesthouse,
  type GuesthouseStatus,
} from "@/lib/guesthouses";
import { firebaseError } from "@/lib/firebase";
export const Route = createFileRoute("/listings")({ component: Guesthouses });
function Guesthouses() {
  const { items, loading, error } = useGuesthouses();
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<Guesthouse | "new" | null>(null);
  const [failure, setFailure] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);
  const [statusFilter, setStatusFilter] = useState<GuesthouseStatus | "all">("all");
  const [changing, setChanging] = useState<string | null>(null);
  useEffect(() => {
    if (editor) editorRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }, [editor]);
  async function changeStatus(item: Guesthouse, status: GuesthouseStatus) {
    const suspending = statusOf(item) === "published" && status === "hidden";
    if (
      suspending &&
      !window.confirm(
        `Suspend ${item.name}? It will no longer appear in the mobile app or the discovery map, but its record, ratings and favourites are kept.`,
      )
    )
      return;
    setChanging(item.id);
    setFailure("");
    try {
      await setGuesthouseStatus(item.id, status);
    } catch (e) {
      setFailure(firebaseError(e));
    } finally {
      setChanging(null);
    }
  }
  const counts = GUESTHOUSE_STATUSES.map(
    (status) => [status, items.filter((item) => statusOf(item) === status).length] as const,
  );
  const visible = items.filter(
    (item) =>
      `${item.name} ${item.city}`.toLowerCase().includes(query.trim().toLowerCase()) &&
      (statusFilter === "all" || statusOf(item) === statusFilter),
  );
  return (
    <>
      <PageHeading
        eyebrow="Shared Firebase database"
        title="Guesthouses"
        description="Manage the listings customers can browse. Suspended listings stay in the database for history."
        action={
          <button
            className="bg-primary text-primary-foreground rounded-md px-4 py-2"
            onClick={() => setEditor("new")}
          >
            Add guesthouse
          </button>
        }
      />
      <div ref={editorRef}>
        {editor && (
          <GuesthouseForm
            key={editor === "new" ? "new" : editor.id}
            item={editor === "new" ? undefined : editor}
            close={() => setEditor(null)}
          />
        )}
      </div>
      <label className="block text-sm mb-5">
        Search by name or city
        <input
          className="block mt-2 rounded-md border p-3 w-full bg-card"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <label className="block text-sm mb-2">
        Show
        <select
          className="block mt-2 rounded-md border p-3 bg-card"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as GuesthouseStatus | "all")}
        >
          <option value="all">All listings ({items.length})</option>
          {counts.map(([status, count]) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]} ({count})
            </option>
          ))}
        </select>
      </label>
      <p className="text-sm text-muted-foreground mb-5">
        Only published listings are shown to customers in the mobile app and on the discovery map.
      </p>
      {(error || failure) && (
        <p role="alert" className="text-red-700 mb-4">
          {error || failure}
        </p>
      )}
      {loading ? (
        <p role="status">Loading guesthouses…</p>
      ) : !error && !visible.length ? (
        <p>
          {items.length
            ? "No matching guesthouses."
            : "No guesthouses yet. Add your first listing."}
        </p>
      ) : null}
      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {visible.map((item) => (
          <article key={item.id} className="rounded-xl border overflow-hidden bg-card">
            <img
              src={item.galleryUrls?.[0] || item.logoUrl}
              alt={item.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-5">
              <p className="text-sm text-muted-foreground">
                {item.city}, {item.country}
              </p>
              <p
                className={
                  statusOf(item) === "published"
                    ? "inline-block text-xs rounded-full bg-green-100 text-green-900 px-2 py-0.5 mt-2"
                    : "inline-block text-xs rounded-full bg-amber-100 text-amber-900 px-2 py-0.5 mt-2"
                }
              >
                {STATUS_LABELS[statusOf(item)]}
              </p>
              <h2 className="text-2xl mt-1">{item.name}</h2>
              <p className="mt-2">P {Number(item.pricePerNight || 0).toLocaleString()} / night</p>
              <p className="text-sm mt-2">
                {Number(item.averageRating || 0).toFixed(1)} ★ · {item.ratingCount || 0} ratings
              </p>
              <div className="flex flex-wrap gap-4 mt-4">
                <button className="underline" onClick={() => setEditor(item)}>
                  Edit
                </button>
                <button
                  className="underline"
                  disabled={changing !== null}
                  onClick={() =>
                    changeStatus(item, statusOf(item) === "published" ? "hidden" : "published")
                  }
                >
                  {changing === item.id
                    ? "Saving…"
                    : statusOf(item) === "published"
                      ? "Suspend"
                      : statusOf(item) === "hidden"
                        ? "Reactivate"
                        : "Publish"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
