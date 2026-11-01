/** Firestore data contract shared with the mobile team. Formatting belongs in the UI. */
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getFirebase } from "./firebase";
/** Who can see a listing in the mobile app: only "published" ones. Drafts are being prepared,
 * hidden ones were taken down temporarily. Listings created before this field existed have
 * no status and count as published. */
export const GUESTHOUSE_STATUSES = ["published", "draft", "hidden"] as const;
export type GuesthouseStatus = (typeof GUESTHOUSE_STATUSES)[number];
export const STATUS_LABELS: Record<GuesthouseStatus, string> = {
  published: "Published",
  draft: "Draft",
  hidden: "Hidden",
};
/** Missing means published (older listings); an unrecognised value is treated as hidden. */
export function statusOf(item: { status?: string | undefined }): GuesthouseStatus {
  if (item.status === undefined || item.status === "published") return "published";
  return item.status === "draft" ? "draft" : "hidden";
}
export type GuesthouseInput = {
  name: string;
  logoUrl: string;
  galleryUrls: string[];
  description: string;
  /** Optional Setswana version of the description, shown in the mobile app's language toggle. */
  descriptionTn?: string;
  /** Visibility in the mobile app. Missing counts as published. */
  status?: GuesthouseStatus;
  amenities: string[];
  location: { lat: number; lng: number };
  pricePerNight: number;
  city: string;
  country: string;
  contact: { phone: string; email: string; [key: string]: unknown };
};
export type Guesthouse = GuesthouseInput & {
  id: string;
  averageRating: number;
  ratingCount: number;
  ratingSum: number;
  createdAt?: { toDate: () => Date };
  createdBy: string;
};
/** Reject invalid values before a write, including requests from outside the form. */
export function validateGuesthouse(data: GuesthouseInput) {
  if (
    ![
      data.name,
      data.city,
      data.country,
      data.description,
      data.contact.phone,
      data.contact.email,
    ].every((v) => v.trim())
  )
    throw new Error("Complete all required guesthouse details.");
  if (data.status !== undefined && !GUESTHOUSE_STATUSES.includes(data.status))
    throw new Error("Choose published, draft or hidden.");
  if ((data.descriptionTn ?? "").length > 2000)
    throw new Error("The Setswana description must be 2000 characters or fewer.");
  if (!Number.isFinite(data.pricePerNight) || data.pricePerNight < 0)
    throw new Error("Price must be a non-negative number.");
  if (
    !Number.isFinite(data.location.lat) ||
    Math.abs(data.location.lat) > 90 ||
    !Number.isFinite(data.location.lng) ||
    Math.abs(data.location.lng) > 180
  )
    throw new Error("Enter valid latitude and longitude.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact.email))
    throw new Error("Enter a valid contact email.");
  if (
    ![data.logoUrl, ...data.galleryUrls].every((value) => {
      try {
        return new URL(value).protocol === "https:";
      } catch {
        return false;
      }
    })
  )
    throw new Error("Image URLs must use HTTPS.");
  if (!data.galleryUrls.length) throw new Error("Provide at least one gallery image URL.");
}
export async function saveGuesthouse(data: GuesthouseInput, id?: string) {
  validateGuesthouse(data);
  const { db, auth } = getFirebase();
  if (!auth.currentUser) throw new Error("Sign in before saving.");
  const payload = {
    ...data,
    name: data.name.trim(),
    city: data.city.trim(),
    nameLower: data.name.trim().toLowerCase(),
    cityLower: data.city.trim().toLowerCase(),
  };
  // Only editable fields are updated. Rating aggregates, creator metadata and
  // optional fields owned by other team members survive edits and concurrent ratings.
  if (id) return updateDoc(doc(db, "guesthouses", id), payload);
  await addDoc(collection(db, "guesthouses"), {
    ...payload,
    averageRating: 0,
    ratingCount: 0,
    ratingSum: 0,
    createdAt: serverTimestamp(),
    createdBy: auth.currentUser.uid,
  });
}
export async function removeGuesthouse(id: string) {
  await deleteDoc(doc(getFirebase().db, "guesthouses", id));
}
/** Publish, hide or return a listing to draft without touching anything else. */
export async function setGuesthouseStatus(id: string, status: GuesthouseStatus) {
  if (!GUESTHOUSE_STATUSES.includes(status)) throw new Error("Choose published, draft or hidden.");
  const { auth, db } = getFirebase();
  if (!auth.currentUser) throw new Error("Sign in before changing a listing.");
  await updateDoc(doc(db, "guesthouses", id), { status });
}
