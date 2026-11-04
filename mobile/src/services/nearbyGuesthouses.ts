import { Guesthouse } from '../types/guesthouse';

export type Coordinates = { lat: number; lng: number };
export type NearbyGuesthouse = Guesthouse & {
  location: Coordinates;
  distanceKm: number;
};

// Advance from the current ID so fast successive swipes cannot reuse an old card index.
export function nextNearbyGuesthouseId(
  items: readonly { id: string }[],
  currentId: string,
  direction: 1 | -1,
): string | null {
  if (!items.length) return null;
  const currentIndex = items.findIndex((item) => item.id === currentId);
  const nextIndex =
    ((currentIndex < 0 ? 0 : currentIndex) + direction + items.length) %
    items.length;
  return items[nextIndex].id;
}

const EARTH_RADIUS_KM = 6371;
const radians = (degrees: number) => (degrees * Math.PI) / 180;

// Haversine measures the shortest distance across Earth's surface.
export function distanceKm(from: Coordinates, to: Coordinates) {
  const latitude = radians(to.lat - from.lat);
  const longitude = radians(to.lng - from.lng);
  const arc =
    Math.sin(latitude / 2) ** 2 +
    Math.cos(radians(from.lat)) *
      Math.cos(radians(to.lat)) *
      Math.sin(longitude / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(arc)));
}

export function nearbyGuesthouses(
  guesthouses: Guesthouse[],
  position: Coordinates,
  radiusKm = 50,
): NearbyGuesthouse[] {
  return guesthouses
    .flatMap((guesthouse) => {
      if (!guesthouse.location) return [];
      const distance = distanceKm(position, guesthouse.location);
      return distance <= radiusKm
        ? [{ ...guesthouse, location: guesthouse.location, distanceKm: distance }]
        : [];
    })
    .sort((left, right) =>
      left.distanceKm - right.distanceKm || left.id.localeCompare(right.id),
    );
}
