import {
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
  getDoc,
  getFirestore,
} from 'firebase/firestore';
const db = getFirestore();

// Add guesthouse to user's favourites
export const addFavourite = async (customerUid: string, guesthouseId: string): Promise<void> => {
  const favRef = doc(db, `customers/${customerUid}/favourites/${guesthouseId}`);
  await setDoc(favRef, { 
    addedAt: new Date().toISOString() 
  });
};

// Remove guesthouse from user's favourites
export const removeFavourite = async (customerUid: string, guesthouseId: string): Promise<void> => {
  const favRef = doc(db, `customers/${customerUid}/favourites/${guesthouseId}`);
  await deleteDoc(favRef);
};

// Get list of favourite guesthouse IDs for a customer
export const getFavouriteIds = async (customerUid: string): Promise<string[]> => {
  const favsRef = collection(db, `customers/${customerUid}/favourites`);
  const snapshot = await getDocs(favsRef);
  return snapshot.docs.map((doc) => doc.id);
};