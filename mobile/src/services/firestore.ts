import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  runTransaction,
  Timestamp,
  QueryConstraint,
  getCountFromServer,
} from 'firebase/firestore';
import { firestore } from '../config/firebase';

// ========== TYPE DEFINITIONS ==========

export interface Guesthouse {
  id?: string;
  name: string;
  nameLower: string;
  logoUrl: string;
  galleryUrls: string[];
  description: string;
  amenities: string[];
  location: {
    lat: number;
    lng: number;
  };
  pricePerNight: number;
  city: string;
  cityLower: string;
  country: string;
  contact: {
    phone: string;
    email: string;
    [key: string]: string;
  };
  averageRating: number;
  ratingCount: number;
  ratingSum: number;
  createdAt: Timestamp | Date;
  createdBy: string;
  numberOfRooms?: number;
  checkInTime?: string;
  houseRules?: string;
}

export interface Admin {
  email: string;
  displayName: string;
  createdAt: Timestamp | Date;
  createdBy: string;
}

export interface Customer {
  email: string;
  displayName: string;
  createdAt: Timestamp | Date;
}

export interface Favourite {
  guesthouseId: string;
  addedAt: Timestamp | Date;
}

export interface Rating {
  guesthouseId: string;
  customerId: string;
  score: number;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface GuesthouseQueryOptions {
  cityFilter?: string;
  sortBy?: 'price' | 'rating';
  sortOrder?: 'asc' | 'desc';
  searchQuery?: string;
  limitCount?: number;
}

// ========== GUESTHOUSE FUNCTIONS ==========

/**
 * Get all guesthouses or filter/sort based on options
 */
export async function getGuesthouses(options: GuesthouseQueryOptions = {}): Promise<Guesthouse[]> {
  if (!firestore) throw new Error('Firestore not initialized');

  const {
    cityFilter,
    sortBy = 'price',
    sortOrder = 'asc',
    searchQuery,
    limitCount,
  } = options;

  const constraints: QueryConstraint[] = [];

  // City filter
  if (cityFilter) {
    constraints.push(where('cityLower', '==', cityFilter.toLowerCase()));
  }

  // Search by name (prefix search)
  if (searchQuery) {
    const searchLower = searchQuery.toLowerCase();
    constraints.push(
      where('nameLower', '>=', searchLower),
      where('nameLower', '<=', searchLower + '')
    );
  }

  // Sorting
  if (sortBy === 'price') {
    constraints.push(orderBy('pricePerNight', sortOrder));
  } else if (sortBy === 'rating') {
    constraints.push(orderBy('averageRating', sortOrder === 'asc' ? 'desc' : 'asc'));
  }

  // Limit
  if (limitCount) {
    constraints.push(limit(limitCount));
  }

  const q = query(collection(firestore, 'guesthouses'), ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Guesthouse[];
}

/**
 * Get a single guesthouse by ID
 */
export async function getGuesthouseById(guesthouseId: string): Promise<Guesthouse | null> {
  if (!firestore) throw new Error('Firestore not initialized');

  const docRef = doc(firestore, 'guesthouses', guesthouseId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as Guesthouse;
}

/**
 * Add a new guesthouse (admin only - enforced by security rules)
 */
export async function addGuesthouse(
  data: Omit<Guesthouse, 'id' | 'createdAt' | 'averageRating' | 'ratingCount' | 'ratingSum'>,
  adminUid: string
): Promise<string> {
  if (!firestore) throw new Error('Firestore not initialized');

  const guesthouseData = {
    ...data,
    nameLower: data.name.toLowerCase(),
    cityLower: data.city.toLowerCase(),
    averageRating: 0,
    ratingCount: 0,
    ratingSum: 0,
    createdAt: serverTimestamp(),
    createdBy: adminUid,
  };

  const docRef = await addDoc(collection(firestore, 'guesthouses'), guesthouseData);
  return docRef.id;
}

/**
 * Update an existing guesthouse (admin only)
 */
export async function updateGuesthouse(
  guesthouseId: string,
  data: Partial<Omit<Guesthouse, 'id' | 'createdAt' | 'createdBy'>>
): Promise<void> {
  if (!firestore) throw new Error('Firestore not initialized');

  const updateData: any = { ...data };

  // Update lowercase fields if name or city changed
  if (data.name) {
    updateData.nameLower = data.name.toLowerCase();
  }
  if (data.city) {
    updateData.cityLower = data.city.toLowerCase();
  }

  const docRef = doc(firestore, 'guesthouses', guesthouseId);
  await updateDoc(docRef, updateData);
}

/**
 * Delete a guesthouse (admin only)
 */
export async function deleteGuesthouse(guesthouseId: string): Promise<void> {
  if (!firestore) throw new Error('Firestore not initialized');

  const docRef = doc(firestore, 'guesthouses', guesthouseId);
  await deleteDoc(docRef);
}

/**
 * Get total guesthouse count
 */
export async function getGuesthouseCount(): Promise<number> {
  if (!firestore) throw new Error('Firestore not initialized');

  const coll = collection(firestore, 'guesthouses');
  const snapshot = await getCountFromServer(coll);
  return snapshot.data().count;
}

// ========== FAVOURITE FUNCTIONS ==========

/**
 * Add a guesthouse to favourites
 */
export async function addFavourite(uid: string, guesthouseId: string): Promise<void> {
  if (!firestore) throw new Error('Firestore not initialized');

  const favouriteData: Favourite = {
    guesthouseId,
    addedAt: serverTimestamp() as Timestamp,
  };

  const docRef = doc(firestore, 'customers', uid, 'favourites', guesthouseId);
  await setDoc(docRef, { ...favouriteData }, { merge: true });
}

/**
 * Remove a guesthouse from favourites
 */
export async function removeFavourite(uid: string, guesthouseId: string): Promise<void> {
  if (!firestore) throw new Error('Firestore not initialized');

  const docRef = doc(firestore, 'customers', uid, 'favourites', guesthouseId);
  await deleteDoc(docRef);
}

/**
 * Get all favourites for a user
 */
export async function getFavourites(uid: string): Promise<string[]> {
  if (!firestore) throw new Error('Firestore not initialized');

  const q = query(collection(firestore, 'customers', uid, 'favourites'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => doc.data().guesthouseId as string);
}

/**
 * Check if a guesthouse is favourited by a user
 */
export async function isFavourite(uid: string, guesthouseId: string): Promise<boolean> {
  if (!firestore) throw new Error('Firestore not initialized');

  const docRef = doc(firestore, 'customers', uid, 'favourites', guesthouseId);
  const docSnap = await getDoc(docRef);

  return docSnap.exists();
}

// ========== RATING FUNCTIONS ==========

/**
 * Submit or update a rating (uses Firestore transaction)
 * This ensures the guesthouse's rating summary stays in sync
 */
export async function submitRating(
  uid: string,
  guesthouseId: string,
  score: number
): Promise<void> {
  if (!firestore) throw new Error('Firestore not initialized');

  // Validate score
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    throw new Error('Rating score must be an integer between 1 and 5');
  }

  const ratingId = `${guesthouseId}_${uid}`;
  const ratingRef = doc(firestore, 'ratings', ratingId);
  const guesthouseRef = doc(firestore, 'guesthouses', guesthouseId);

  await runTransaction(firestore, async (transaction) => {
    // Read current rating and guesthouse
    const ratingSnap = await transaction.get(ratingRef);
    const guesthouseSnap = await transaction.get(guesthouseRef);

    if (!guesthouseSnap.exists()) {
      throw new Error('Guesthouse not found');
    }

    const guesthouseData = guesthouseSnap.data() as Guesthouse;
    let newRatingSum = guesthouseData.ratingSum || 0;
    let newRatingCount = guesthouseData.ratingCount || 0;

    if (ratingSnap.exists()) {
      // Update existing rating
      const oldScore = ratingSnap.data().score;
      newRatingSum += score - oldScore;

      transaction.update(ratingRef, {
        score,
        updatedAt: serverTimestamp(),
      });
    } else {
      // New rating
      newRatingSum += score;
      newRatingCount += 1;

      transaction.set(ratingRef, {
        guesthouseId,
        customerId: uid,
        score,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // Update guesthouse rating summary
    const newAverageRating = newRatingCount > 0 ? newRatingSum / newRatingCount : 0;

    transaction.update(guesthouseRef, {
      ratingSum: newRatingSum,
      ratingCount: newRatingCount,
      averageRating: newAverageRating,
    });
  });
}

/**
 * Get all ratings for a guesthouse
 */
export async function getRatingsForGuesthouse(guesthouseId: string): Promise<Rating[]> {
  if (!firestore) throw new Error('Firestore not initialized');

  const q = query(
    collection(firestore, 'ratings'),
    where('guesthouseId', '==', guesthouseId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => doc.data() as Rating);
}

/**
 * Get a user's rating for a specific guesthouse
 */
export async function getUserRating(uid: string, guesthouseId: string): Promise<Rating | null> {
  if (!firestore) throw new Error('Firestore not initialized');

  const ratingId = `${guesthouseId}_${uid}`;
  const docRef = doc(firestore, 'ratings', ratingId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return docSnap.data() as Rating;
}

// ========== CUSTOMER FUNCTIONS ==========

/**
 * Create a customer profile
 */
export async function createCustomerProfile(
  uid: string,
  email: string,
  displayName: string
): Promise<void> {
  if (!firestore) throw new Error('Firestore not initialized');

  const customerData: Customer = {
    email,
    displayName,
    createdAt: serverTimestamp() as Timestamp,
  };

  const docRef = doc(firestore, 'customers', uid);
  await setDoc(docRef, { ...customerData }, { merge: true });
}

/**
 * Get customer profile
 */
export async function getCustomerProfile(uid: string): Promise<Customer | null> {
  if (!firestore) throw new Error('Firestore not initialized');

  const docRef = doc(firestore, 'customers', uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return docSnap.data() as Customer;
}

// ========== ADMIN FUNCTIONS ==========

/**
 * Create an admin account (existing admin only)
 */
export async function createAdmin(
  uid: string,
  email: string,
  displayName: string,
  createdByUid: string
): Promise<void> {
  if (!firestore) throw new Error('Firestore not initialized');

  const adminData: Admin = {
    email,
    displayName,
    createdAt: serverTimestamp() as Timestamp,
    createdBy: createdByUid,
  };

  const docRef = doc(firestore, 'admins', uid);
  await setDoc(docRef, { ...adminData }, { merge: true });
}

/**
 * Check if a user is an admin
 */
export async function isAdmin(uid: string): Promise<boolean> {
  if (!firestore) throw new Error('Firestore not initialized');

  const docRef = doc(firestore, 'admins', uid);
  const docSnap = await getDoc(docRef);

  return docSnap.exists();
}

/**
 * Get all admins
 */
export async function getAllAdmins(): Promise<(Admin & { uid: string })[]> {
  if (!firestore) throw new Error('Firestore not initialized');

  const snapshot = await getDocs(collection(firestore, 'admins'));

  return snapshot.docs.map((doc) => ({
    uid: doc.id,
    ...doc.data(),
  })) as (Admin & { uid: string })[];
}
