// "Similar stays": ranks other listings by how alike they are. Pure logic, no network.
import type { Guesthouse } from '../types/guesthouse';

// Below this score a listing is not alike enough to suggest.
const SIMILARITY_FLOOR = 2.5;

const normal = (value: string) => value.trim().toLowerCase();

export function similarityScore(a: Guesthouse, b: Guesthouse) {
  let score = 0;
  // Same city is the strongest signal.
  if (a.city && normal(a.city) === normal(b.city)) score += 3;
  // Closer prices score higher, from 0 (very different) to 2 (identical).
  const highest = Math.max(a.pricePerNight, b.pricePerNight, 1);
  score +=
    2 *
    (1 - Math.min(1, Math.abs(a.pricePerNight - b.pricePerNight) / highest));
  // Shared amenities, as a fraction of all amenities either offers.
  const left = new Set(a.amenities.map(normal));
  const right = new Set(b.amenities.map(normal));
  const union = new Set([...left, ...right]);
  const shared = [...left].filter((item) => right.has(item)).length;
  if (union.size) score += 3 * (shared / union.size);
  // Similar guest ratings, only when both have been rated.
  if (a.ratingCount > 0 && b.ratingCount > 0)
    score += 1 - Math.min(1, Math.abs(a.averageRating - b.averageRating) / 4);
  return score;
}

export function similarGuesthouses(
  current: Guesthouse,
  all: Guesthouse[],
  limit = 3,
) {
  return all
    .filter((item) => item.id !== current.id)
    .map((item) => ({ item, score: similarityScore(current, item) }))
    .filter(({ score }) => score >= SIMILARITY_FLOOR)
    .sort((x, y) => y.score - x.score || x.item.id.localeCompare(y.item.id))
    .slice(0, limit)
    .map(({ item }) => item);
}
