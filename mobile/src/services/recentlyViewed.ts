// Recently viewed guesthouses, remembered on this device only (never sent anywhere,
// not tied to an account). The list logic is pure so it can be unit-tested.
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Guesthouse } from '../types/guesthouse';

const STORAGE_KEY = '@guesthouse_recently_viewed';
export const MAX_RECENT = 10;

// Move the viewed guesthouse to the front, drop duplicates and keep only the newest few.
export function addRecentlyViewed(
  list: string[],
  id: string,
  max = MAX_RECENT,
): string[] {
  if (!id) return list.slice(0, max);
  return [id, ...list.filter((item) => item !== id)].slice(0, max);
}

// Stored text can be missing or damaged; anything unusable becomes an empty list.
export function parseRecentlyViewed(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === 'string' && !!item)
      .filter((item, index, all) => all.indexOf(item) === index)
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

// Turn saved ids into listings, newest first. Guesthouses that were deleted or are no
// longer available are skipped rather than shown as broken cards.
export function resolveRecentlyViewed(
  ids: string[],
  listings: Guesthouse[],
  limit = 6,
): Guesthouse[] {
  const byId = new Map(listings.map((item) => [item.id, item]));
  return ids
    .map((id) => byId.get(id))
    .filter((item): item is Guesthouse => Boolean(item))
    .slice(0, limit);
}

export async function loadRecentlyViewed(): Promise<string[]> {
  try {
    return parseRecentlyViewed(await AsyncStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

export async function recordView(id: string) {
  try {
    const next = addRecentlyViewed(await loadRecentlyViewed(), id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Remembering is a convenience; a storage failure must never break the page.
  }
}

export async function clearRecentlyViewed() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do: the list simply stays as it was.
  }
}
