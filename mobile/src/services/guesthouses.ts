import {
  collection,
  DocumentData,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';

import { firestore } from '../config/firebase';
import { Coordinates, Guesthouse } from '../types/guesthouse';

export type GuesthouseSort = 'priceAsc' | 'priceDesc' | 'rating' | 'distance';
export type GuesthouseSearch = {
  text?: string;
  field?: 'nameLower' | 'cityLower' | 'all';
  sort?: GuesthouseSort;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  // Keep only listings that offer every one of these amenities.
  amenities?: string[];
  // Where the traveller is. Needed for the 'distance' sort.
  origin?: Coordinates | null;
};

// Only published listings are shown to customers. A missing status means published, so
// listings created before the status field existed stay visible, and "active" is the older
// name for published. Draft, hidden, suspended and any unrecognised value are kept out of
// every list and screen.
export function isPublished(status: unknown) {
  return status === undefined || status === 'published' || status === 'active';
}

// Accept only real map positions; anything else is treated as "no location".
export function readCoordinates(value: unknown): Coordinates | null {
  const { lat, lng } = (value ?? {}) as { lat?: unknown; lng?: unknown };
  return typeof lat === 'number' &&
    Number.isFinite(lat) &&
    Math.abs(lat) <= 90 &&
    typeof lng === 'number' &&
    Number.isFinite(lng) &&
    Math.abs(lng) <= 180
    ? { lat, lng }
    : null;
}

// Compare amenity names without case, spaces or dashes, so "Wi-Fi" and "WiFi" match.
export function amenityKey(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, '');
}

// Great-circle distance in kilometres (haversine formula).
export function distanceKm(from: Coordinates, to: Coordinates) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = radians(to.lat - from.lat);
  const dLng = radians(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(from.lat)) *
      Math.cos(radians(to.lat)) *
      Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function sortAndFilterGuesthouses(
  listings: Guesthouse[],
  options: GuesthouseSearch,
) {
  const text = options.text?.trim().toLowerCase() ?? '';
  return listings
    .filter(
      (item) =>
        options.field !== 'all' ||
        !text ||
        item.name.toLowerCase().includes(text) ||
        item.city.toLowerCase().includes(text),
    )
    .filter(
      (item) =>
        item.pricePerNight >= (options.minPrice ?? 0) &&
        item.pricePerNight <= (options.maxPrice ?? Infinity) &&
        (!options.minRating ||
          (item.ratingCount > 0 && item.averageRating >= options.minRating)),
    )
    .filter((item) =>
      (options.amenities ?? []).every((wanted) =>
        (item.amenities ?? []).some(
          (offered) => amenityKey(offered) === amenityKey(wanted),
        ),
      ),
    )
    .sort((a, b) => {
      if (options.sort === 'distance' && options.origin) {
        // Listings without a map position go last instead of pretending to be close.
        const from = options.origin;
        const da = a.location ? distanceKm(from, a.location) : Infinity;
        const db = b.location ? distanceKm(from, b.location) : Infinity;
        if (da !== db) return da < db ? -1 : 1;
      }
      const difference =
        options.sort === 'rating'
          ? b.averageRating - a.averageRating ||
            a.pricePerNight - b.pricePerNight
          : options.sort === 'priceDesc'
            ? b.pricePerNight - a.pricePerNight
            : a.pricePerNight - b.pricePerNight;
      return difference || a.id.localeCompare(b.id);
    });
}

function imageUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const url = value.trim();
  return /^https?:\/\//i.test(url) ? url : null;
}

// Reject invalid prices/names rather than rendering a fabricated listing.
export function mapGuesthouse(
  id: string,
  data: DocumentData,
): Guesthouse | null {
  if (
    typeof data.name !== 'string' ||
    !data.name.trim() ||
    typeof data.pricePerNight !== 'number' ||
    !Number.isFinite(data.pricePerNight) ||
    data.pricePerNight < 0 ||
    !isPublished(data.status)
  )
    return null;

  const gallery = Array.isArray(data.galleryUrls)
    ? data.galleryUrls.map(imageUrl).find((url: string | null) => url !== null)
    : null;
  return {
    id,
    name: data.name.trim(),
    city: typeof data.city === 'string' ? data.city.trim() : '',
    country: typeof data.country === 'string' ? data.country.trim() : '',
    pricePerNight: data.pricePerNight,
    averageRating:
      typeof data.averageRating === 'number' &&
      Number.isFinite(data.averageRating)
        ? Math.min(5, Math.max(0, data.averageRating))
        : 0,
    ratingCount:
      typeof data.ratingCount === 'number' && Number.isFinite(data.ratingCount)
        ? Math.max(0, Math.floor(data.ratingCount))
        : 0,
    amenities: Array.isArray(data.amenities)
      ? [
          ...new Set(
            data.amenities
              .filter(
                (value: unknown): value is string =>
                  typeof value === 'string' && Boolean(value.trim()),
              )
              .map((value: string) => value.trim()),
          ),
        ]
      : [],
    description:
      typeof data.description === 'string' ? data.description.trim() : '',
    imageUrl: gallery || imageUrl(data.logoUrl),
    location: readCoordinates(data.location),
    descriptionTn:
      typeof data.descriptionTn === 'string' ? data.descriptionTn.trim() : '',
  };
}

export function subscribeToGuesthouses(
  onChange: (guesthouses: Guesthouse[], fromCache: boolean) => void,
  onError: (error: unknown) => void,
  options: GuesthouseSearch = {},
) {
  if (!firestore) {
    onError(
      new Error(
        'Guesthouses are unavailable. Please check the Firebase configuration.',
      ),
    );
    return () => {};
  }
  const prefix = options.text?.trim().toLowerCase() ?? '';
  const field = options.field ?? 'nameLower';
  // Combined name/city substring search uses the live collection and filters locally.
  // Explicit single-field prefix results are sorted locally, preserving
  // every matching record when switching between price and rating.
  const guesthousesQuery =
    prefix && field !== 'all'
      ? query(
          collection(firestore, 'guesthouses'),
          orderBy(field),
          where(field, '>=', prefix),
          where(field, '<=', prefix + '\uf8ff'),
        )
      : query(
          collection(firestore, 'guesthouses'),
          orderBy(
            options.sort === 'rating' && field !== 'all'
              ? 'averageRating'
              : 'pricePerNight',
            field !== 'all' &&
              (options.sort === 'priceDesc' || options.sort === 'rating')
              ? 'desc'
              : 'asc',
          ),
        );
  return onSnapshot(
    guesthousesQuery,
    { includeMetadataChanges: true },
    (snapshot) => {
      // Wait for the server before treating an empty initial cache as an empty database.
      if (snapshot.empty && snapshot.metadata.fromCache) return;
      onChange(
        sortAndFilterGuesthouses(
          snapshot.docs
            .map((document) => mapGuesthouse(document.id, document.data()))
            .filter(
              (guesthouse): guesthouse is Guesthouse => guesthouse !== null,
            ),
          options,
        ),
        snapshot.metadata.fromCache,
      );
    },
    onError,
  );
}

export function guesthousesErrorMessage(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === 'permission-denied')
    return 'Guesthouses could not be loaded. Please contact the Lala team about access.';
  if (code === 'unavailable' || code === 'deadline-exceeded')
    return 'Unable to connect. Check your internet connection and try again.';
  return error instanceof Error && !code
    ? error.message
    : 'Guesthouses could not be loaded. Please try again.';
}
