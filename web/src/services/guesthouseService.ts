// guesthouseService.ts
// Shared Firestore service layer for the Lala guesthouse platform.
// The SAME file is used in both apps:
//   web/src/services/guesthouseService.ts
//   mobile/src/services/guesthouseService.ts
// The web app obtains its browser-only Firebase instance from src/lib/firebase.ts.
// Field names and types follow docs/firestore-schema.md. Do not rename fields here
// without updating that document and telling every team.

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import type { Timestamp } from "firebase/firestore";
import { getFirebase } from "../lib/firebase";

// ---------- Types ----------

// What an admin supplies when registering a guesthouse (the registration form fields).
export interface GuesthouseInput {
  name: string;
  logoUrl: string;
  galleryUrls: string[];
  description: string;
  amenities: string[];
  location: { lat: number; lng: number };
  pricePerNight: number;
  city: string;
  country: string;
  contact: { phone: string; email: string };
}

// A guesthouse as stored in Firestore, plus its document ID.
export interface Guesthouse extends GuesthouseInput {
  id: string;
  nameLower: string; // lowercase copy of name, used for search
  cityLower: string; // lowercase copy of city, used for search
  averageRating: number; // ratingSum / ratingCount, 0 when unrated
  ratingCount: number;
  ratingSum: number;
  createdAt?: Timestamp;
  createdBy: string; // UID of the admin who registered it
}

// How the guesthouse list can be ordered.
export type GuesthouseSort = "price" | "rating";

// ---------- Guesthouses ----------

// Returns every guesthouse. Default order is cheapest first (a project requirement);
// pass "rating" to get the highest-rated first instead.
// Note: Firestore leaves out any document that is missing the field being sorted on,
// so every guesthouse must have pricePerNight and averageRating set.
export async function getGuesthouses(sortBy: GuesthouseSort = "price"): Promise<Guesthouse[]> {
  const { db } = getFirebase();
  const guesthousesRef = collection(db, "guesthouses");
  const q =
    sortBy === "rating"
      ? query(guesthousesRef, orderBy("averageRating", "desc"))
      : query(guesthousesRef, orderBy("pricePerNight", "asc"));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Guesthouse, "id">) }));
}

// Returns one guesthouse by its document ID, or null if it does not exist.
export async function getGuesthouseById(id: string): Promise<Guesthouse | null> {
  const { db } = getFirebase();
  const snapshot = await getDoc(doc(db, "guesthouses", id));
  if (!snapshot.exists()) {
    return null;
  }
  return { id: snapshot.id, ...(snapshot.data() as Omit<Guesthouse, "id">) };
}

// Registers a new guesthouse and returns its new document ID.
// Must be called while logged in as an admin (the security rules enforce this too).
// Fills in the fields the form should not have to supply: the lowercase search copies,
// the three rating fields (all start at 0), the creation time and the admin's UID.
export async function addGuesthouse(data: GuesthouseInput): Promise<string> {
  const { auth, db } = getFirebase();
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be logged in as an admin to add a guesthouse.");
  }

  const name = (data.name ?? "").trim();
  const city = (data.city ?? "").trim();
  const country = (data.country ?? "").trim();
  const description = (data.description ?? "").trim();
  if (!name || !city || !country || !description) {
    throw new Error("Name, description, city and country are required.");
  }

  // Forms usually give numbers as text, so convert and check them.
  // Stored as real numbers so sorting and the dashboard maths work.
  const pricePerNight = Number(data.pricePerNight);
  const lat = Number(data.location?.lat);
  const lng = Number(data.location?.lng);
  if (!Number.isFinite(pricePerNight) || pricePerNight < 0) {
    throw new Error("Price per night must be a number of 0 or more.");
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Location needs a valid latitude and longitude.");
  }

  const docRef = await addDoc(collection(db, "guesthouses"), {
    name,
    nameLower: name.toLowerCase(),
    logoUrl: data.logoUrl ?? "",
    galleryUrls: data.galleryUrls ?? [],
    description,
    amenities: data.amenities ?? [],
    location: { lat, lng },
    pricePerNight,
    city,
    cityLower: city.toLowerCase(),
    country,
    contact: data.contact,
    averageRating: 0,
    ratingCount: 0,
    ratingSum: 0,
    createdAt: serverTimestamp(),
    createdBy: user.uid,
  });

  return docRef.id;
}

// ---------- Favourites ----------

// Saves a guesthouse to a customer's favourites.
// The favourite's document ID is the guesthouse ID, so saving twice cannot create duplicates.
export async function addFavourite(uid: string, guesthouseId: string): Promise<void> {
  const { db } = getFirebase();
  await setDoc(doc(db, "customers", uid, "favourites", guesthouseId), {
    guesthouseId,
    addedAt: serverTimestamp(),
  });
}

// Removes a guesthouse from a customer's favourites (does nothing if it was not saved).
export async function removeFavourite(uid: string, guesthouseId: string): Promise<void> {
  const { db } = getFirebase();
  await deleteDoc(doc(db, "customers", uid, "favourites", guesthouseId));
}

// Extra helper for the "My Favourites" screen: returns the guesthouse IDs a customer has saved.
export async function getFavourites(uid: string): Promise<string[]> {
  const { db } = getFirebase();
  const snapshot = await getDocs(collection(db, "customers", uid, "favourites"));
  return snapshot.docs.map((d) => d.id);
}

// ---------- Ratings ----------

// Saves a customer's 1-5 rating for a guesthouse and updates that guesthouse's
// average, all inside ONE transaction so the rating and the summary can never disagree.
// - First time rating: the sum goes up by the score and the count goes up by 1.
// - Changing an earlier rating: the sum changes by the difference and the count stays the same.
// The rating document ID is "<guesthouseId>_<uid>", which allows only one rating per customer.
// Returns the guesthouse's new average and rating count.
export async function submitRating(
  uid: string,
  guesthouseId: string,
  score: number
): Promise<{ averageRating: number; ratingCount: number }> {
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    throw new Error("A rating must be a whole number from 1 to 5.");
  }

  const { db } = getFirebase();
  const guesthouseRef = doc(db, "guesthouses", guesthouseId);
  const ratingRef = doc(db, "ratings", `${guesthouseId}_${uid}`);

  return runTransaction(db, async (transaction) => {
    // Firestore transactions require every read to happen before any write.
    const guesthouseSnap = await transaction.get(guesthouseRef);
    const ratingSnap = await transaction.get(ratingRef);

    const guesthouse = guesthouseSnap.data();
    if (!guesthouse) {
      throw new Error("Guesthouse not found.");
    }
    const existingRating = ratingSnap.data();

    let ratingSum = Number(guesthouse["ratingSum"] ?? 0);
    let ratingCount = Number(guesthouse["ratingCount"] ?? 0);

    if (existingRating) {
      // This customer already rated it: swap the old score for the new one.
      ratingSum += score - Number(existingRating["score"]);
    } else {
      // Brand new rating.
      ratingSum += score;
      ratingCount += 1;
    }

    // Average to 2 decimal places, or 0 when there are no ratings.
    const averageRating = ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 100) / 100 : 0;

    transaction.set(ratingRef, {
      guesthouseId,
      customerId: uid,
      score,
      createdAt: existingRating?.["createdAt"] ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    // Only the three rating-summary fields change, which is all the security rules allow a customer to touch.
    transaction.update(guesthouseRef, { ratingSum, ratingCount, averageRating });

    return { averageRating, ratingCount };
  });
}
