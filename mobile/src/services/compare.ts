// Side-by-side comparison of two guesthouses. Pure logic, no network.
import type { Guesthouse } from '../types/guesthouse';

export type CompareRow = {
  label: string;
  a: string;
  b: string;
  // Which side wins this row, or null when it is a tie or not comparable.
  better: 'a' | 'b' | null;
};

export type Comparison = {
  rows: CompareRow[];
  shared: string[];
  onlyA: string[];
  onlyB: string[];
};

const money = (value: number) =>
  `P ${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
const normal = (value: string) => value.trim().toLowerCase();

function winner(a: number, b: number, higherIsBetter: boolean) {
  if (a === b) return null;
  return a > b === higherIsBetter ? 'a' : 'b';
}

export function compareGuesthouses(a: Guesthouse, b: Guesthouse): Comparison {
  const bothRated = a.ratingCount > 0 && b.ratingCount > 0;
  const rating = (item: Guesthouse) =>
    item.ratingCount > 0
      ? `★ ${item.averageRating.toFixed(1)}`
      : 'Not rated yet';
  const rows: CompareRow[] = [
    {
      label: 'Price per night',
      a: money(a.pricePerNight),
      b: money(b.pricePerNight),
      better: winner(a.pricePerNight, b.pricePerNight, false),
    },
    {
      label: 'Guest rating',
      a: rating(a),
      b: rating(b),
      // A rating only counts as better when both have real ratings to compare.
      better: bothRated ? winner(a.averageRating, b.averageRating, true) : null,
    },
    {
      label: 'Number of ratings',
      a: String(a.ratingCount),
      b: String(b.ratingCount),
      better: winner(a.ratingCount, b.ratingCount, true),
    },
    {
      label: 'City',
      a: a.city || 'Not listed',
      b: b.city || 'Not listed',
      better: null,
    },
    {
      label: 'Amenities',
      a: String(a.amenities.length),
      b: String(b.amenities.length),
      better: winner(a.amenities.length, b.amenities.length, true),
    },
  ];
  const left = new Map(a.amenities.map((item) => [normal(item), item]));
  const right = new Map(b.amenities.map((item) => [normal(item), item]));
  return {
    rows,
    shared: [...left.entries()]
      .filter(([key]) => right.has(key))
      .map(([, v]) => v),
    onlyA: [...left.entries()]
      .filter(([key]) => !right.has(key))
      .map(([, v]) => v),
    onlyB: [...right.entries()]
      .filter(([key]) => !left.has(key))
      .map(([, v]) => v),
  };
}
