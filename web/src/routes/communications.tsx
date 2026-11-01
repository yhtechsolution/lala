/** Contact actions use the device's email/telephone applications. No messages are
 * stored, sent or marked delivered by the portal, and no new backend access is needed. */
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeading } from "@/components/portal-shell";
import { useGuesthouses } from "@/lib/live-guesthouses";
export const Route = createFileRoute("/communications")({ component: Communications });
function Communications() {
  const { items, loading, error } = useGuesthouses();
  const [query, setQuery] = useState("");
  const visible = items.filter((item) =>
    `${item.name} ${item.city}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeading
        eyebrow="Guesthouse contacts"
        title="Communications"
        description="Find contact details and open your email or phone application."
      />
      <div className="rounded-xl border bg-secondary p-5 text-sm">
        This is a contact directory. Email opens a draft in your configured email app; Call opens
        your device's calling app if supported. The portal does not send messages or track delivery.
      </div>
      <label className="block text-sm">
        Search guesthouses or cities
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="block mt-2 w-full rounded-md border bg-card p-3"
          placeholder="Search contacts…"
        />
      </label>
      {loading ? (
        <p role="status">Loading contacts…</p>
      ) : error ? (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      ) : !visible.length ? (
        <p>No matching guesthouse contacts.</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {visible.map((item) => {
            // Validate destinations instead of placing untrusted contact text in a URL.
            const email = typeof item.contact?.email === "string" ? item.contact.email.trim() : "";
            const phone = typeof item.contact?.phone === "string" ? item.contact.phone.trim() : "";
            const emailOk = /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(email);
            const number = phone.replace(/[\s().-]/g, "");
            const phoneOk = /^\+?[0-9]{5,15}$/.test(number);
            const subject = encodeURIComponent(`Lala platform — ${item.name}`);
            return (
              <article key={item.id} className="rounded-xl border bg-card p-6">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {item.city}
                </p>
                <h2 className="text-2xl mt-2">{item.name}</h2>
                <dl className="text-sm mt-4 space-y-2">
                  <div>
                    <dt className="text-muted-foreground">Email</dt>
                    <dd className="break-all">{email || "Not provided"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd>{phone || "Not provided"}</dd>
                  </div>
                </dl>
                <div className="flex flex-wrap gap-3 mt-5">
                  {emailOk && (
                    <a
                      className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm"
                      href={`mailto:${encodeURIComponent(email)}?subject=${subject}`}
                    >
                      Open email draft
                    </a>
                  )}
                  {phoneOk && (
                    <a className="rounded-md border px-4 py-2 text-sm" href={`tel:${number}`}>
                      Call guesthouse
                    </a>
                  )}
                  {!emailOk && !phoneOk && (
                    <p className="text-xs text-muted-foreground">
                      Update this guesthouse's contact details to enable these actions.
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
