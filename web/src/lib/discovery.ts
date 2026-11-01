import type { Guesthouse } from "./guesthouses";
/** Country never determines eligibility; invalid/missing coordinates are not invented. */
export function isMappableListing(item: Guesthouse) {
  const lat = item.location?.lat,
    lng = item.location?.lng;
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}
/** Plain text DOM nodes prevent listing names from becoming executable popup HTML. */
export function popupContent(item: Guesthouse) {
  const node = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = String(item.name || "Guesthouse");
  node.append(title);
  const details = document.createElement("p");
  details.textContent = `${item.city || "Unknown city"}, ${item.country || "Unknown country"} · BWP ${Number(item.pricePerNight || 0).toLocaleString()} / night`;
  node.append(details);
  return node;
}
