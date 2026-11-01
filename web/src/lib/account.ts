import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  updatePassword,
} from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { getFirebase } from "./firebase";
export async function requestPasswordReset(email: string) {
  const address = email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address))
    throw new Error("Enter a valid email address first.");
  try {
    await sendPasswordResetEmail(getFirebase().auth, address);
  } catch (error) {
    if ((error as { code?: string }).code !== "auth/user-not-found") throw error;
  }
}
export async function changePassword(current: string, next: string, confirmation: string) {
  const user = getFirebase().auth.currentUser;
  if (!user?.email) throw new Error("Sign in again before changing your password.");
  if (!current) throw new Error("Enter your current password.");
  if (next.length < 8)
    throw new Error(
      "Use at least eight characters; your Firebase password policy may require more.",
    );
  if (next !== confirmation) throw new Error("The new passwords do not match.");
  if (next === current) throw new Error("Choose a different password.");
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, current));
  await updatePassword(user, next);
}
export async function saveDisplayName(name: string) {
  const { auth, db } = getFirebase();
  if (!auth.currentUser) throw new Error("Sign in again.");
  const value = name.trim();
  if (!value || value.length > 80) throw new Error("Use a display name of 1 to 80 characters.");
  // The portal's source of truth is the existing admin profile. Never write roles here.
  await updateDoc(doc(db, "admins", auth.currentUser.uid), { displayName: value });
}
