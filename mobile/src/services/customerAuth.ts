import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';

import { auth, firestore } from '../config/firebase';

function requireAuth() {
  if (!auth || !firestore)
    throw new Error(
      'Sign in is unavailable. Please check the Firebase configuration.',
    );
  return auth;
}

// A retry repairs an interrupted signup without replacing the original createdAt.
export async function saveCustomerProfile(user: User, displayName: string) {
  requireAuth();
  const name = displayName.trim();
  if (!name) throw new Error('Please enter your full name.');
  await updateProfile(user, { displayName: name });
  const ref = doc(firestore!, 'customers', user.uid);
  await runTransaction(firestore!, async (transaction) => {
    const existing = await transaction.get(ref);
    if (!existing.exists()) {
      transaction.set(ref, {
        email: user.email,
        displayName: name,
        createdAt: serverTimestamp(),
      });
    }
  });
}

export async function signUpCustomer(
  email: string,
  password: string,
  displayName: string,
) {
  if (!displayName.trim()) throw new Error('Please enter your full name.');
  const credential = await createUserWithEmailAndPassword(
    requireAuth(),
    email.trim(),
    password,
  );
  await saveCustomerProfile(credential.user, displayName);
  return credential.user;
}

export async function signInCustomer(email: string, password: string) {
  return signInWithEmailAndPassword(requireAuth(), email.trim(), password);
}

export async function signOutCustomer() {
  await signOut(requireAuth());
}

export async function resetCustomerPassword(email: string) {
  await sendPasswordResetEmail(requireAuth(), email.trim());
}

export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password. Please check your credentials or reset your password.';
    case 'auth/email-already-in-use':
      return 'An account already uses this email. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
    case 'auth/password-does-not-meet-requirements':
      return 'Please choose a stronger password that meets the account requirements.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
    case 'unavailable':
      return 'Unable to connect. Check your internet connection and try again.';
    case 'auth/user-disabled':
      return 'This account is disabled. Please contact the Lala team.';
    case 'permission-denied':
      return 'Your account profile could not be saved. Please try again or contact the Lala team.';
    case 'auth/operation-not-allowed':
      return 'Email and password sign in is currently unavailable. Please contact the Lala team.';
    default:
      return error instanceof Error && !code
        ? error.message
        : 'Something went wrong. Please try again.';
  }
}
