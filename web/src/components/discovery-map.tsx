import { useEffect, useRef, useState } from "react";
import type { Guesthouse } from "@/lib/guesthouses";
import { popupContent } from "@/lib/discovery";
type Point = [number, number];
interface Layer {
  addTo(target: MapInstance | Group): Layer;
  on(event: string, callback: () => void): Layer;
  bindPopup(node: HTMLElement): Layer;
  openPopup(): Layer;
}
interface Group extends Layer {
  clearLayers(): void;
}
interface MapInstance {
  setView(point: Point, zoom: number): MapInstance;
  fitBounds(points: Point[], options?: Record<string, unknown>): MapInstance;
  remove(): void;
  invalidateSize(): void;
}
interface Leaflet {
  map(node: HTMLElement, options: Record<string, unknown>): MapInstance;
  tileLayer(url: string, options: Record<string, unknown>): Layer;
  layerGroup(): Group;
  circleMarker(point: Point, options: Record<string, unknown>): Layer;
}
let loading: Promise<Leaflet> | undefined;
function loadLeaflet(): Promise<Leaflet> {
  const existing = (window as unknown as { L?: Leaflet }).L;
  if (existing) return Promise.resolve(existing);
  if (loading) return loading;
  loading = new Promise<Leaflet>((resolve, reject) => {
    if (!document.getElementById("lala-leaflet-css")) {
      const css = document.createElement("link");
      css.id = "lala-leaflet-css";
      css.rel = "stylesheet";
      css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.append(css);
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    const timer = window.setTimeout(() => {
      script.remove();
      loading = undefined;
      reject(new Error("Map library timed out. Check your connection and retry."));
    }, 15000);
    script.onload = () => {
      clearTimeout(timer);
      const lib = (window as unknown as { L?: Leaflet }).L;
      if (lib) resolve(lib);
      else {
        loading = undefined;
        reject(new Error("Map library unavailable."));
      }
    };
    script.onerror = () => {
      clearTimeout(timer);
      script.remove();
      loading = undefined;
      reject(new Error("Map library could not load. Check your connection and retry."));
    };
    document.head.append(script);
  });
  return loading;
}
export function DiscoveryMap({
  items,
  selected,
  resetKey,
}: {
  items: Guesthouse[];
  selected: string;
  resetKey: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef<{ map: MapInstance; group: Group; lib: Leaflet } | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Loading global map…");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    let resize: ResizeObserver | undefined;
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    setReady(false);
    setError("");
    setStatus("Loading global map…");
    void loadLeaflet()
      .then((lib) => {
        if (cancelled || !host.current) return;
        const map = lib
          .map(host.current, { minZoom: 2, maxZoom: 18, scrollWheelZoom: false })
          .setView([15, 10], 2);
        const group = lib.layerGroup();
        group.addTo(map);
        live.current = { map, group, lib };
        let failures = 0;
        const tiles = lib.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          noWrap: true,
          referrerPolicy: "strict-origin-when-cross-origin",
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>',
        });
        tiles.on("tileerror", () => {
          failures++;
          if (!cancelled)
            setError(
              "Background map tiles were blocked or could not load. Listings remain available. Check your connection, browser privacy settings and map request headers.",
            );
        });
        tiles.on("load", () => {
          if (!cancelled) {
            setStatus("");
            if (!failures) setError("");
          }
        });
        tiles.addTo(map);
        watchdog = setTimeout(() => {
          if (!cancelled)
            setStatus(
              "If the background is still blank, check the connection or retry. You can use the listing directory.",
            );
        }, 15000);
        tiles.on("load", () => {
          clearTimeout(watchdog);
        });
        if (typeof ResizeObserver !== "undefined") {
          resize = new ResizeObserver(() => map.invalidateSize());
          resize.observe(host.current);
        }
        setReady(true);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Map unavailable.");
          setStatus("");
        }
      });
    return () => {
      cancelled = true;
      clearTimeout(watchdog);
      resize?.disconnect();
      live.current?.map.remove();
      live.current = undefined;
    };
  }, [attempt]);
  useEffect(() => {
    if (!ready || !live.current) return;
    const { group, map, lib } = live.current;
    group.clearLayers();
    for (const item of items) {
      const marker = lib.circleMarker([item.location.lat, item.location.lng], {
        radius: item.id === selected ? 11 : 7,
        color: "#493b30",
        fillColor: item.id === selected ? "#d9a848" : "#9a7351",
        fillOpacity: 0.9,
        weight: 2,
      });
      marker.addTo(group);
      marker.bindPopup(popupContent(item));
      if (item.id === selected) {
        map.setView([item.location.lat, item.location.lng], 12);
        marker.openPopup();
      }
    }
  }, [items, selected, ready]);
  useEffect(() => {
    if (ready) live.current?.map.setView([15, 10], 2);
  }, [resetKey, ready]);
  return (
    <div className="min-w-0">
      <div
        ref={host}
        aria-label="Interactive global guesthouse map"
        className="relative z-0 h-[520px] w-full rounded-xl border bg-card"
      />
      {status && (
        <p role="status" className="mt-2 text-sm">
          {status}
        </p>
      )}
      {error && (
        <div role="alert" className="mt-2 rounded border border-amber-400 p-3 text-sm">
          {error}{" "}
          <button className="underline" onClick={() => setAttempt((n) => n + 1)}>
            Retry map
          </button>
        </div>
      )}
    </div>
  );
}
