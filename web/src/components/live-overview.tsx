/** Dashboard statistics derive only from actual Firestore guesthouse records. */
import { PageHeading } from "./portal-shell";
import { useGuesthouses } from "@/lib/live-guesthouses";
import { AiInsight } from "./ai-insight";
export function LiveOverview({ analytics = false }: { analytics?: boolean }) {
  const { items, loading, error } = useGuesthouses();
  const cities = items.reduce<Record<string, number>>((all, item) => {
    const city = item.city || "Unspecified";
    all[city] = (all[city] || 0) + 1;
    return all;
  }, {});
  const rankings = [...items]
    .filter((item) => item.ratingCount > 0)
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, 5);
  return (
    <>
      <PageHeading
        eyebrow="Live listing data"
        title={analytics ? "Analytics" : "Platform Overview"}
        description="Figures come from the shared guesthouses collection."
      />
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Loading statistics…</p>
      ) : (
        !error && (
          <>
            <div className="grid gap-4 sm:grid-cols-3 mb-6">
              {[
                ["Guesthouses", items.length],
                ["Cities", Object.keys(cities).length],
                ["Ratings", items.reduce((sum, item) => sum + (item.ratingCount || 0), 0)],
              ].map(([label, value]) => (
                <div key={label} className="bg-card border rounded-xl p-6">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-3xl mt-2">{value}</p>
                </div>
              ))}
            </div>
            <AiInsight items={items} />
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="bg-card border rounded-xl p-6">
                <h2 className="text-2xl mb-4">Guesthouses by city</h2>
                {Object.entries(cities)
                  .sort((a, b) => b[1] - a[1])
                  .map(([city, count]) => (
                    <p className="flex justify-between border-b py-3" key={city}>
                      <span>{city}</span>
                      <strong>{count}</strong>
                    </p>
                  ))}
                {!items.length && <p>No guesthouses yet.</p>}
              </section>
              <section className="bg-card border rounded-xl p-6">
                <h2 className="text-2xl mb-4">Top rated guesthouses</h2>
                {rankings.map((item) => (
                  <p className="flex justify-between border-b py-3" key={item.id}>
                    <span>{item.name}</span>
                    <span>{item.averageRating.toFixed(1)} ★</span>
                  </p>
                ))}
                {!rankings.length && <p>No rated guesthouses yet.</p>}
              </section>
            </div>
          </>
        )
      )}
    </>
  );
}
