/** Browser-only Firebase initialization. Configuration stays in the local .env;
 * authorization is enforced by the team's deployed Firebase rules. */
import { getApp, getApps, initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

let appCheckStarted = false;

/** App Check proves requests come from this app, which protects the AI quota from abuse.
 * It starts only when VITE_APPCHECK_SITE_KEY is set, so local setups work without it. */
function startAppCheck(app: ReturnType<typeof initializeApp>) {
  const siteKey = import.meta.env["VITE_APPCHECK_SITE_KEY"];
  if (appCheckStarted || !siteKey) return;
  if (import.meta.env.DEV) {
    // Prints a debug token in the browser console; register it under App Check in the console.
    (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN =
      true;
  }
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
  appCheckStarted = true;
}

export function getFirebase() {
  if (typeof window === "undefined")
    throw new Error("Firebase is initialized in the browser only.");
  const config = {
    apiKey: import.meta.env["VITE_FIREBASE_API_KEY"],
    authDomain: import.meta.env["VITE_FIREBASE_AUTH_DOMAIN"],
    projectId: import.meta.env["VITE_FIREBASE_PROJECT_ID"],
    storageBucket: import.meta.env["VITE_FIREBASE_STORAGE_BUCKET"],
    messagingSenderId: import.meta.env["VITE_FIREBASE_MESSAGING_SENDER_ID"],
    appId: import.meta.env["VITE_FIREBASE_APP_ID"],
  };
  if (Object.values(config).some((value) => !value || value.startsWith("your_"))) {
    throw new Error("Fill in the six Firebase values in web/.env, then restart npm run dev.");
  }
  const app = getApps().length ? getApp() : initializeApp(config);
  startAppCheck(app);
  return { auth: getAuth(app), db: getFirestore(app) };
}

/** Translate common failures without exposing credentials or raw server responses. */
export function firebaseError(error: unknown): string {
  const code = (error as { code?: string })?.code;
  if (
    code === "auth/invalid-credential" ||
    code === "auth/wrong-password" ||
    code === "auth/user-not-found"
  )
    return "Email or password is incorrect.";
  if (code === "permission-denied")
    return "Firebase denied access. Check your admin membership and the deployed rules.";
  if (code === "auth/too-many-requests") return "Too many attempts. Please try again later.";
  if (code === "auth/network-request-failed" || code === "unavailable")
    return "Unable to reach Firebase. Check your connection and try again.";
  return error instanceof Error ? error.message : "The operation failed. Please try again.";
}
