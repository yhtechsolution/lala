import { doc, DocumentData, onSnapshot } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { Guesthouse } from '../types/guesthouse';
import { mapGuesthouse } from './guesthouses';

export type GuesthouseDetails = Guesthouse & {
  galleryUrls: string[];
  logoUrl: string | null;
  location: { lat: number; lng: number } | null;
  contact: Record<string, string>;
  numberOfRooms: number | null;
  checkInTime: string;
  checkOutTime: string;
  houseRules: string;
};
const text = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';
const image = (value: unknown) =>
  /^https?:\/\//i.test(text(value)) ? text(value) : null;

// Extend the shared list model without inventing missing public property details.
export function mapGuesthouseDetails(
  id: string,
  data: DocumentData,
): GuesthouseDetails | null {
  const listing = mapGuesthouse(id, data);
  if (!listing) return null;
  const { lat, lng } = data.location ?? {};
  return {
    ...listing,
    galleryUrls: [
      ...new Set<string>(
        Array.isArray(data.galleryUrls)
          ? data.galleryUrls
              .map(image)
              .filter((url): url is string => url !== null)
          : [],
      ),
    ],
    logoUrl: image(data.logoUrl),
    location:
      typeof lat === 'number' &&
      Number.isFinite(lat) &&
      Math.abs(lat) <= 90 &&
      typeof lng === 'number' &&
      Number.isFinite(lng) &&
      Math.abs(lng) <= 180
        ? { lat, lng }
        : null,
    contact:
      data.contact && typeof data.contact === 'object'
        ? Object.fromEntries(
            Object.entries(data.contact)
              .filter(([, value]) => text(value))
              .map(([key, value]) => [key, text(value)]),
          )
        : {},
    numberOfRooms:
      Number.isInteger(data.numberOfRooms) && data.numberOfRooms >= 0
        ? data.numberOfRooms
        : null,
    checkInTime: text(data.checkInTime),
    checkOutTime: text(data.checkOutTime),
    houseRules: text(data.houseRules),
  };
}

// Listen to one public listing, including edits and deletion while its screen is open.
export function subscribeToGuesthouseDetails(
  id: string,
  onChange: (value: GuesthouseDetails | null, fromCache: boolean) => void,
  onError: (error: unknown) => void,
) {
  if (!id || id.includes('/')) {
    onChange(null, false);
    return () => {};
  }
  if (!firestore) {
    onError(
      new Error(
        'Guesthouse details are unavailable. Please check the Firebase configuration.',
      ),
    );
    return () => {};
  }
  return onSnapshot(
    doc(firestore, 'guesthouses', id),
    { includeMetadataChanges: true },
    (snapshot) => {
      if (!snapshot.exists() && snapshot.metadata.fromCache) return;
      onChange(
        snapshot.exists()
          ? mapGuesthouseDetails(snapshot.id, snapshot.data())
          : null,
        snapshot.metadata.fromCache,
      );
    },
    onError,
  );
}
