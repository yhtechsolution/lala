import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, firestore } from '../config/firebase';

function requireCustomer() {
  if (!auth?.currentUser)
    throw new Error('Please sign in to save favourites and submit ratings.');
  if (!firestore)
    throw new Error(
      'This feature is unavailable. Please check the Firebase configuration.',
    );
  return { db: firestore, uid: auth.currentUser.uid };
}
function validateId(id: string) {
  if (!id || id.includes('/'))
    throw new Error('This guesthouse is unavailable.');
}
export async function setGuesthouseFavourite(id: string, saved: boolean) {
  const { db, uid } = requireCustomer();
  validateId(id);
  const favourite = doc(db, 'customers', uid, 'favourites', id);
  if (!saved) {
    // Transactions report offline failures rather than leaving a queued removal
    // waiting indefinitely for acknowledgement. The listing may already be gone.
    await runTransaction(db, async (transaction) => {
      const existing = await transaction.get(favourite);
      if (existing.exists()) transaction.delete(favourite);
    });
    return;
  }
  await runTransaction(db, async (transaction) => {
    const listing = await transaction.get(doc(db, 'guesthouses', id));
    const existing = await transaction.get(favourite);
    if (!listing.exists())
      throw new Error('This guesthouse is no longer available.');
    if (!existing.exists())
      transaction.set(favourite, {
        guesthouseId: id,
        addedAt: serverTimestamp(),
      });
  });
}
export function subscribeToFavouriteIds(
  uid: string,
  onChange: (ids: string[], fromCache: boolean) => void,
  onError: (error: unknown) => void,
) {
  if (!firestore) {
    onError(
      new Error(
        'Favourites are unavailable. Please check the Firebase configuration.',
      ),
    );
    return () => {};
  }
  return onSnapshot(
    collection(firestore, 'customers', uid, 'favourites'),
    { includeMetadataChanges: true },
    (snapshot) => {
      if (snapshot.empty && snapshot.metadata.fromCache) return;
      onChange(
        snapshot.docs.map((document) => document.id),
        snapshot.metadata.fromCache,
      );
    },
    onError,
  );
}
export async function getCustomerRating(id: string) {
  const { db, uid } = requireCustomer();
  validateId(id);
  const snapshot = await getDoc(doc(db, 'ratings', `${id}_${uid}`));
  const score = snapshot.data()?.score;
  return snapshot.exists() &&
    Number.isInteger(score) &&
    score >= 1 &&
    score <= 5
    ? (score as number)
    : null;
}

// One transaction changes both the customer's unique rating and the summary.
// Re-rating adjusts the sum by the score difference without increasing the count.
export async function submitRating(id: string, score: number) {
  const { db, uid } = requireCustomer();
  validateId(id);
  if (!Number.isInteger(score) || score < 1 || score > 5)
    throw new Error('Choose a whole-number rating from 1 to 5 stars.');
  const guesthouse = doc(db, 'guesthouses', id);
  const rating = doc(db, 'ratings', `${id}_${uid}`);
  return runTransaction(db, async (transaction) => {
    const listing = await transaction.get(guesthouse);
    const previous = await transaction.get(rating);
    if (!listing.exists())
      throw new Error('This guesthouse is no longer available.');
    const data = listing.data();
    const count = data.ratingCount;
    const sum = data.ratingSum;
    if (
      !Number.isInteger(count) ||
      count < 0 ||
      !Number.isInteger(sum) ||
      sum < count ||
      sum > count * 5
    ) {
      throw new Error(
        'The guesthouse rating summary needs attention. Please contact the Lala team.',
      );
    }
    const oldScore = previous.exists() ? previous.data().score : 0;
    if (
      previous.exists() &&
      (!Number.isInteger(oldScore) || oldScore < 1 || oldScore > 5 || count < 1)
    ) {
      throw new Error(
        'Your existing rating could not be updated. Please contact the Lala team.',
      );
    }
    const ratingCount = count + (previous.exists() ? 0 : 1);
    const ratingSum = sum - oldScore + score;
    if (ratingSum < ratingCount || ratingSum > ratingCount * 5)
      throw new Error('The guesthouse rating summary could not be updated.');
    const averageRating = ratingSum / ratingCount;
    transaction.set(rating, {
      guesthouseId: id,
      customerId: uid,
      score,
      createdAt: previous.exists()
        ? previous.data().createdAt
        : serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    transaction.update(guesthouse, { ratingCount, ratingSum, averageRating });
    return { ratingCount, ratingSum, averageRating };
  });
}
export function engagementErrorMessage(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === 'permission-denied')
    return 'Your change could not be saved. Please sign in again or contact the Lala team about access.';
  if (code === 'unavailable' || code === 'deadline-exceeded')
    return 'Unable to connect. Check your internet connection and try again.';
  return error instanceof Error && !code
    ? error.message
    : 'Your change could not be saved. Please try again.';
}
