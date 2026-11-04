/** Dashboard summary written by AI from the figures on this page. Nothing is stored. */
import { useMemo, useState } from "react";
import { aiErrorMessage, computeDashboardStats, generateInsight } from "@/lib/ai";
import type { Guesthouse } from "@/lib/guesthouses";

export function AiInsight({ items }: { items: Guesthouse[] }) {
  const stats = useMemo(() => computeDashboardStats(items), [items]);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    setError("");
    try {
      setSummary(await generateInsight(stats));
    } catch (failure) {
      console.error("AI error:", failure);
      setError(aiErrorMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bg-card border rounded-xl p-6 mb-6" aria-label="AI summary">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl">AI summary</h2>
        <button
          type="button"
          onClick={run}
          disabled={busy || !items.length}
          className="border rounded-md px-4 py-2 text-sm"
        >
          {busy ? "Writing…" : summary ? "Regenerate" : "Generate summary"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700 mt-3">
          {error}
        </p>
      )}
      {summary && !error && (
        <>
          <p className="mt-4">{summary}</p>
          <p className="text-xs text-muted-foreground mt-3">
            AI-generated from the aggregate figures on this page. Check it against the numbers
            before sharing.
          </p>
        </>
      )}
      {!summary && !error && (
        <p className="text-sm text-muted-foreground mt-3">
          Writes a short plain-language summary of the figures below. Only totals are sent to the
          AI, never customer data.
        </p>
      )}
    </section>
  );
}
