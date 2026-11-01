import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeading } from "@/components/portal-shell";
import { useGuesthouses } from "@/lib/live-guesthouses";
import { DiscoveryMap } from "@/components/discovery-map";
import { isMappableListing } from "@/lib/discovery";
export const Route = createFileRoute("/discovery")({ component: Discovery });
function Discovery() {
  return <DiscoveryContent {...useGuesthouses()} />;
}
export function DiscoveryContent({
  items,
  loading,
  error,
}: {
  items: import("@/lib/guesthouses").Guesthouse[];
  loading: boolean;
  error: string;
}) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [selected, setSelected] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const eligible = useMemo(() => items.filter(isMappableListing), [items]);
  const cities = useMemo(() => Array.from(new Set(eligible.map((i) => i.city))).sort(), [eligible]);
  const results = useMemo(
    () =>
      eligible.filter(
        (i) =>
          (!city || i.city === city) &&
          `${i.name} ${i.city} ${i.country}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [eligible, city, query],
  );

  return (
    <>
      <PageHeading
        eyebrow="Explore worldwide"
        title="Guesthouse discovery"
        description="Discover live listings by location, compare nightly prices on a global map."
      />
      <div className="mb-5 flex flex-wrap gap-3">
        <label className="flex-1">
          Search
          <input
            className="mt-1 block w-full rounded border bg-card p-3"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected("");
            }}
            placeholder="Guesthouse, city or country"
          />
        </label>
        <label>
          City
          <select
            className="mt-1 block rounded border bg-card p-3"
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setSelected("");
            }}
          >
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <button
          onClick={() => {
            setResetKey((n) => n + 1);
            setQuery("");
            setCity("");
            setSelected("");
          }}
          className="self-end rounded border p-3"
        >
          Reset map
        </button>
      </div>
      {loading && <p role="status">Loading guesthouses…</p>}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <p className="mb-4 text-sm text-muted-foreground">
        {results.length} mapped listings worldwide. {items.length - eligible.length} listings
        excluded because coordinates are missing or invalid. Numeric latitude must be -90 to 90;
        longitude -180 to 180.
      </p>
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <DiscoveryMap items={results} selected={selected} resetKey={resetKey} />
        <section aria-label="Mapped guesthouses" className="max-h-[520px] space-y-3 overflow-auto">
          {!loading && !results.length && (
            <p className="rounded-xl border p-5">
              No matching guesthouses. Check the latitude and longitude in Guesthouses, or clear
              your filters.
            </p>
          )}
          {results.map((i) => (
            <button
              key={i.id}
              onClick={() => setSelected(i.id)}
              aria-pressed={selected === i.id}
              className={`block w-full rounded-xl border p-5 text-left ${selected === i.id ? "border-primary bg-secondary" : "bg-card"}`}
            >
              <h2 className="font-semibold">{i.name}</h2>
              <p className="text-sm text-muted-foreground">{i.city}</p>
              <p className="mt-2 font-semibold">
                BWP {Number(i.pricePerNight).toLocaleString()} / night
              </p>
              <p className="text-sm">
                {i.ratingCount
                  ? `${Number(i.averageRating).toFixed(1)} / 5 (${i.ratingCount} ratings)`
                  : "No ratings yet"}
              </p>
              <p className="mt-2 text-xs">Select to locate on map</p>
            </button>
          ))}
        </section>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Map requires internet access. Pan and zoom worldwide; use + / - or touch controls to zoom.
        Prices are listing prices, not availability or booking quotations.
      </p>
    </>
  );
}
