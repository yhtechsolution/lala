/** Firebase session and live admin membership. No localStorage demo flag grants access. */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { firebaseError, getFirebase } from "./firebase";

type AdminSession = {
  user: User | null;
  displayName: string;
  ready: boolean;
  isAdmin: boolean;
  error: string;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
};
const Context = createContext<AdminSession | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setAdmin] = useState(false);
  const [displayName, setName] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let stopAuth = () => {};
    let stopMembership = () => {};
    let active = true;
    let generation = 0;
    try {
      const { auth, db } = getFirebase();
      stopAuth = onAuthStateChanged(
        auth,
        (next) => {
          const current = ++generation;
          stopMembership();
          setAdmin(false);
          setName("");
          setUser(next);
          setReady(!next);
          setError("");
          if (!next) return;
          // Reading one's own admin document is allowed by the supplied rules. Keep
          // listening so removing membership also closes the workspace immediately.
          stopMembership = onSnapshot(
            doc(db, "admins", next.uid),
            (snapshot) => {
              if (!active || current !== generation) return;
              setAdmin(snapshot.exists());
              setName(String(snapshot.data()?.["displayName"] || next.email || "Admin"));
              setError(
                snapshot.exists()
                  ? ""
                  : "This account has no admin access. Ask your team lead to create admins/<your UID>.",
              );
              setReady(true);
            },
            (failure) => {
              if (active && current === generation) {
                setAdmin(false);
                setError(firebaseError(failure));
                setReady(true);
              }
            },
          );
        },
        (failure) => {
          if (active) {
            setAdmin(false);
            setError(firebaseError(failure));
            setReady(true);
          }
        },
      );
    } catch (failure) {
      setError(firebaseError(failure));
      setReady(true);
    }
    return () => {
      active = false;
      generation++;
      stopMembership();
      stopAuth();
    };
  }, []);
  async function login(email: string, password: string, remember = false) {
    await setPersistence(
      getFirebase().auth,
      remember ? browserLocalPersistence : browserSessionPersistence,
    );
    setError("");
    await signInWithEmailAndPassword(getFirebase().auth, email.trim(), password);
  }
  async function logout() {
    await signOut(getFirebase().auth);
  }
  return (
    <Context.Provider value={{ user, displayName, ready, isAdmin, error, login, logout }}>
      {children}
    </Context.Provider>
  );
}
export function useAdmin() {
  const value = useContext(Context);
  if (!value) throw new Error("AdminAuthProvider is missing");
  return value;
}
