/** Listing analytics, separate from the operational dashboard. All figures use live
 * guesthouse records; registration history describes surviving listings, not traffic. */
import { useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { PageHeading } from "@/components/portal-shell";
import { useGuesthouses } from "@/lib/live-guesthouses";

export const Route = createFileRoute("/analytics")({ component: Analytics });
const COLORS = ["#4e3b30", "#b68b68", "#8e9081", "#b193aa"];
const money = (value: number) => `P ${value.toLocaleString("en-BW", { maximumFractionDigits: 0 })}`;
const validNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const average = (values: number[]) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const cityName = (value: string) => value?.trim() || "Unspecified";

function Analytics() {
  const { items, loading, error } = useGuesthouses();
  const [city, setCity] = useState("All cities");
  const cities = [...new Set(items.map((item) => cityName(item.city)))].sort();
  const selected = items.filter((item) => city === "All cities" || cityName(item.city) === city);
  // Invalid/missing values are excluded from calculations rather than becoming zeros.
  const prices = selected
    .map((item) => item.pricePerNight)
    .filter((value) => validNumber(value) && value >= 0)
    .sort((a, b) => a - b);
  const mean = average(prices);
  const median = prices.length
    ? (prices[Math.floor((prices.length - 1) / 2)]! + prices[Math.floor(prices.length / 2)]!) / 2
    : null;
  const rated = selected.filter(
    (item) =>
      Number.isInteger(item.ratingCount) &&
      item.ratingCount > 0 &&
      validNumber(item.ratingSum) &&
      item.ratingSum >= item.ratingCount &&
      item.ratingSum <= item.ratingCount * 5,
  );
  const ratingCount = rated.reduce((sum, item) => sum + item.ratingCount, 0);
  const weightedRating = ratingCount
    ? rated.reduce((sum, item) => sum + item.ratingSum, 0) / ratingCount
    : null;
  const coverage = selected.length ? Math.round((rated.length / selected.length) * 100) : 0;
  const cityRows = [...new Set(selected.map((item) => cityName(item.city)))]
    .map((name) => {
      const group = selected.filter((item) => cityName(item.city) === name);
      const groupPrices = group
        .map((item) => item.pricePerNight)
        .filter((value) => validNumber(value) && value >= 0);
      return {
        name,
        count: group.length,
        price: average(groupPrices),
        share: Math.round((group.length / selected.length) * 100),
      };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const priceBands = [
    { name: "Under P 500", value: prices.filter((p) => p < 500).length },
    { name: "P 500–999", value: prices.filter((p) => p >= 500 && p < 1000).length },
    { name: "P 1,000–1,499", value: prices.filter((p) => p >= 1000 && p < 1500).length },
    { name: "P 1,500+", value: prices.filter((p) => p >= 1500).length },
  ];
  // Local calendar months, oldest first. Missing/unresolved timestamps are not dated.
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      name: date.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
      count: 0,
    };
  });
  let dated = 0;
  selected.forEach((item) => {
    if (typeof item.createdAt?.toDate !== "function") return;
    const date = item.createdAt.toDate();
    if (!Number.isFinite(date.getTime()) || date > now) return;
    const month = months.find((entry) => entry.key === `${date.getFullYear()}-${date.getMonth()}`);
    if (month) {
      month.count++;
      dated++;
    }
  });
  const cityPrices = cityRows
    .filter((row) => row.price !== null)
    .sort((a, b) => b.price! - a.price!)
    .slice(0, 8);
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeading
        eyebrow="Listing intelligence"
        title="Analytics"
        description="Explore pricing, geographic coverage and guesthouse ratings."
        action={
          <label className="text-sm">
            Filter by city
            <select
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="ml-3 rounded-md border bg-card px-3 py-2"
            >
              <option>All cities</option>
              {cities.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
        }
      />
      {loading ? (
        <p role="status">Loading analytics…</p>
      ) : error ? (
        <p role="alert" className="rounded-xl border p-5 text-red-700">
          {error}
        </p>
      ) : !selected.length ? (
        <p className="rounded-xl border bg-card p-6">
          No listings for this selection. Add guesthouses or choose another city.
        </p>
      ) : (
        <>
          <section className="rounded-2xl border bg-card p-6 md:p-8">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Portfolio snapshot · {city}
            </p>
            <h2 className="mt-3 text-3xl">Understand your guesthouse collection</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {selected.length} listings across {cityRows.length} cities. {rated.length} listings
              have valid rating summaries.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full bg-secondary px-4 py-2">
                Most represented: {cityRows[0]?.name} ({cityRows[0]?.share}%)
              </span>
              <span className="rounded-full bg-secondary px-4 py-2">
                Price range:{" "}
                {prices.length
                  ? `${money(prices[0]!)} – ${money(prices[prices.length - 1]!)}`
                  : "Not available"}
              </span>
            </div>
          </section>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              title="Average nightly price"
              value={mean === null ? "—" : money(mean)}
              note={`${prices.length} listings with valid prices`}
            />
            <Metric
              title="Median nightly price"
              value={median === null ? "—" : money(median)}
              note="Middle price; less affected by extremes"
            />
            <Metric
              title="Weighted guest rating"
              value={weightedRating === null ? "Unrated" : `${weightedRating.toFixed(2)} / 5`}
              note={`Weighted across ${ratingCount} ratings`}
            />
            <Metric
              title="Rating coverage"
              value={`${coverage}%`}
              note={`${rated.length} of ${selected.length} listings have ratings`}
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Nightly price distribution" note="Number of listings in each price band.">
              {prices.length ? (
                <>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={priceBands}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                        >
                          {priceBands.map((band, index) => (
                            <Cell key={band.name} fill={COLORS[index]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    {priceBands.map((band) => (
                      <p key={band.name}>
                        {band.name}: <strong>{band.value}</strong>
                      </p>
                    ))}
                  </div>
                </>
              ) : (
                <p>No valid prices available.</p>
              )}
            </Panel>
            <Panel
              title="Average price by city"
              note="Up to eight cities, ordered by average nightly price (BWP)."
            >
              {cityPrices.length ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cityPrices} layout="vertical" margin={{ left: 5, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={95} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar
                        dataKey="price"
                        name="Average price (BWP)"
                        fill="#b68b68"
                        radius={[0, 5, 5, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p>No valid prices available.</p>
              )}
            </Panel>
          </div>
          <Panel
            title="Registration history"
            note="Currently existing listings created in each of the last six calendar months. Deleted listings are excluded; this is not customer traffic."
          >
            {dated ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={months}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      name="Listings added"
                      fill="#8e9081"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-8 text-sm text-muted-foreground">
                No valid registration timestamps within the last six months.
              </p>
            )}
            {dated > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {months.map((month) => `${month.name}: ${month.count}`).join(" · ")}
              </p>
            )}
          </Panel>
          <Panel
            title="City comparison"
            note="Portfolio share and price comparisons for the selected listings."
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <caption className="sr-only">
                  Guesthouse count, share and average price by city
                </caption>
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th scope="col" className="py-3 pr-4">
                      City
                    </th>
                    <th scope="col">Listings</th>
                    <th scope="col">Portfolio share</th>
                    <th scope="col">Average / night</th>
                  </tr>
                </thead>
                <tbody>
                  {cityRows.map((row) => (
                    <tr key={row.name} className="border-b last:border-0">
                      <th scope="row" className="py-4 pr-4 font-medium">
                        {row.name}
                      </th>
                      <td>{row.count}</td>
                      <td>{row.share}%</td>
                      <td>{row.price === null ? "—" : money(row.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <p className="text-xs text-muted-foreground">
            Live Firestore snapshot. Prices are listed rates, not revenue. Ratings use valid
            aggregate summaries. Page views, bookings and inquiries are not tracked by the current
            schema.
          </p>
        </>
      )}
    </div>
  );
}
function Metric({ title, value, note }: { title: string; value: string; note: string }) {
  return (
    <article className="rounded-xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{note}</p>
    </article>
  );
}
function Panel({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-xl border bg-card p-5 md:p-6">
      <h2 className="text-xl">{title}</h2>
      <p className="mt-1 mb-5 text-xs text-muted-foreground">{note}</p>
      {children}
    </section>
  );
}
