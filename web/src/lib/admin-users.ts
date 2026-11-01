/** Creating another administrator from the portal.
 *
 * Creating a Firebase login from the browser signs the browser in as the new user, which
 * would log the current admin out. The standard workaround on the free plan (no Cloud
 * Functions) is a second, temporary Firebase app whose sign-in state is kept in memory
 * only. The new login is created there, then admins/<uid> is written with the CURRENT
 * admin's session, so the security rules still decide who may grant admin access.
 *
 * The orchestration (`provisionAdmin`) takes its Firebase calls as parameters so every
 * success and failure path can be unit-tested without a network.
 */
import { deleteApp, getApp, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  initializeAuth,
  inMemoryPersistence,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { firebaseError, getFirebase } from "./firebase";

export const MIN_ADMIN_PASSWORD_LENGTH = 12;

export type NewAdminInput = {
  email: string;
  displayName: string;
  password: string;
  /** Email the new admin a link so they can choose their own password. */
  sendReset: boolean;
};

export type ProvisionResult = {
  uid: string;
  /** The email already had a login, so it was promoted instead of created. */
  reusedExisting: boolean;
  resetEmailSent: boolean;
};

/** The Firebase operations the flow needs. Real versions are built below. */
export type AdminProvisioner = {
  createAccount(email: string, password: string): Promise<string>;
  signInExisting(email: string, password: string): Promise<string>;
  saveProfile(uid: string, profile: { email: string; displayName: string }): Promise<void>;
  sendResetEmail(email: string): Promise<void>;
  /** Sign out of the temporary app and delete it. Always called. */
  finish(): Promise<void>;
};

export function validateNewAdmin(input: NewAdminInput): NewAdminInput {
  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
  if (!displayName || displayName.length > 80)
    throw new Error("Use a display name of 1 to 80 characters.");
  if (input.password.length < MIN_ADMIN_PASSWORD_LENGTH)
    throw new Error(
      `Use a temporary password of at least ${MIN_ADMIN_PASSWORD_LENGTH} characters; your Firebase password policy may require more.`,
    );
  return { ...input, email, displayName };
}

const codeOf = (error: unknown) => (error as { code?: string } | null)?.code;

export async function provisionAdmin(
  deps: AdminProvisioner,
  rawInput: NewAdminInput,
): Promise<ProvisionResult> {
  const input = validateNewAdmin(rawInput);
  try {
    let uid: string;
    let reusedExisting = false;
    try {
      uid = await deps.createAccount(input.email, input.password);
    } catch (error) {
      if (codeOf(error) !== "auth/email-already-in-use") throw error;
      // Either someone already has this login, or an earlier attempt created it but could
      // not grant admin access. The matching password proves it is safe to continue.
      try {
        uid = await deps.signInExisting(input.email, input.password);
      } catch {
        throw new Error(
          "That email already has an account. Enter that account's current password to give it admin access, or use a different email.",
        );
      }
      reusedExisting = true;
    }
    try {
      await deps.saveProfile(uid, { email: input.email, displayName: input.displayName });
    } catch (error) {
      throw new Error(
        `The login exists but admin access was not granted: ${firebaseError(error)} Try again with the same email and password.`,
      );
    }
    let resetEmailSent = false;
    if (input.sendReset && !reusedExisting) {
      try {
        await deps.sendResetEmail(input.email);
        resetEmailSent = true;
      } catch {
        // The admin was created; sharing the temporary password is the fallback.
      }
    }
    return { uid, reusedExisting, resetEmailSent };
  } finally {
    await deps.finish().catch(() => undefined);
  }
}

/** Real Firebase operations: a temporary in-memory app for the new login, the main session for Firestore. */
function createProvisioner(): AdminProvisioner {
  const { auth, db } = getFirebase();
  const creator = auth.currentUser;
  if (!creator) throw new Error("Sign in again before adding an administrator.");
  const temporaryApp = initializeApp(getApp().options, `admin-creator-${Date.now()}`);
  const temporaryAuth = initializeAuth(temporaryApp, { persistence: inMemoryPersistence });
  return {
    createAccount: async (email, password) =>
      (await createUserWithEmailAndPassword(temporaryAuth, email, password)).user.uid,
    signInExisting: async (email, password) =>
      (await signInWithEmailAndPassword(temporaryAuth, email, password)).user.uid,
    // setDoc without merge: replacing an existing admin profile is refused by the rules.
    saveProfile: (uid, profile) =>
      setDoc(doc(db, "admins", uid), {
        email: profile.email,
        displayName: profile.displayName,
        createdAt: serverTimestamp(),
        createdBy: creator.uid,
      }),
    sendResetEmail: (email) => sendPasswordResetEmail(temporaryAuth, email),
    finish: async () => {
      await signOut(temporaryAuth).catch(() => undefined);
      await deleteApp(temporaryApp);
    },
  };
}

export function createAdminAccount(input: NewAdminInput) {
  // Validate first so a bad form never opens a temporary Firebase app.
  validateNewAdmin(input);
  return provisionAdmin(createProvisioner(), input);
}

/* ---------- Temporary password generator ---------- */

const GROUPS = ["abcdefghijkmnopqrstuvwxyz", "ABCDEFGHJKLMNPQRSTUVWXYZ", "23456789", "!@#$%^&*?-_"];

/** Uniform random integer in [0, max) from the browser's secure generator (no modulo bias). */
function secureRandomInt(max: number): number {
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const buffer = new Uint32Array(1);
  do crypto.getRandomValues(buffer);
  while ((buffer[0] ?? 0) >= limit);
  return (buffer[0] ?? 0) % max;
}

/** A random password with at least one lowercase letter, uppercase letter, digit and symbol. */
export function generatePassword(
  length = 16,
  randomInt: (max: number) => number = secureRandomInt,
): string {
  const size = Math.max(length, GROUPS.length);
  const pool = GROUPS.join("");
  const chars = [
    ...GROUPS.map((group) => group[randomInt(group.length)] as string),
    ...Array.from({ length: size - GROUPS.length }, () => pool[randomInt(pool.length)] as string),
  ];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j] as string, chars[i] as string];
  }
  return chars.join("");
}
