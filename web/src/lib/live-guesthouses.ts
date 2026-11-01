/** Subscribe only after admin verification; detach and clear data on sign-out. */
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { useAdmin } from "./admin-auth";
import { firebaseError, getFirebase } from "./firebase";
import type { Guesthouse } from "./guesthouses";
export function useGuesthouses() {
  const { user, isAdmin } = useAdmin();
  const uid = user?.uid;
  const [items, setItems] = useState<Guesthouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    setItems([]);
    setError("");
    setLoading(true);
    if (!isAdmin || !uid) {
      setLoading(false);
      return;
    }
    return onSnapshot(
      collection(getFirebase().db, "guesthouses"),
      (snapshot) => {
        setItems(
          snapshot.docs.map((record) => ({ ...record.data(), id: record.id }) as Guesthouse),
        );
        setLoading(false);
      },
      (failure) => {
        setItems([]);
        setError(firebaseError(failure));
        setLoading(false);
      },
    );
  }, [uid, isAdmin]);
  return { items, loading, error };
}
