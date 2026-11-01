# Customer authentication — issue #40

The mobile Profile tab uses the existing [Figma authentication screen](https://www.figma.com/design/5B4DBqIcaPxqtLWQUMdyCq/mobile-version?node-id=59-1844). Its Sign In/Create Account control switches between the email/password forms. The authentication typography, labels, spacing, shadows, and navigation icons follow that Figma frame; demo controls appear only as real error and dialog states. The design's sample credentials and simulated error showcase are replaced with empty fields and actual validation errors. Password visibility, Help, and the reset-password sheet work. Browsing remains available without signing in.

Signup creates a Firebase Auth account, sets its display name, then creates `customers/{uid}` with `email`, `displayName`, and a server `createdAt` timestamp. If account creation succeeds but profile setup is interrupted, the signed-in Profile tab offers **Save Customer Profile**. Retrying preserves an existing customer's creation timestamp. Customer records use the repository's owner-only Firestore rules.

Native sessions use Firebase's `getReactNativePersistence(AsyncStorage)`; the web preview uses browser local persistence. `AuthProvider` waits for Firebase's initial session restoration and observes the customer record. Sign Out clears the session.

## Running

1. Run `npm install` in `mobile`.
2. Configure `mobile/.env` as described in the root README. Enable **Email/Password** in Firebase Authentication and deploy the repository's Firestore rules.
3. Run `npm start`, open the app, and choose **Profile**. Create Account requires full name, email, and a password of at least six characters; Firebase also enforces the project's password policy.

For a local browser preview, run `npm run web`.

## Verification

From `mobile`:

```bash
npm run typecheck
npm run test:auth
```

The auth integration command requires Firebase CLI (`firebase-tools`) and Java 21 or newer. It starts local Auth and Firestore emulators using the isolated `demo-lala-auth` project and repository rules. It verifies account/profile creation, timestamps, duplicate emails, owner-only writes, wrong credentials, successful login, interrupted profile setup, password reset, and native persistence across a fresh process. The persistence check uses the actual Firebase React Native adapter with a file-backed implementation of AsyncStorage's three storage methods; testing on a physical phone is still needed to verify native storage integration.

For interactive emulator testing, start `firebase emulators:start --config ../firebase.auth-test.json --project demo-lala-auth --only auth,firestore`. In the app's development environment, set the Firebase project ID to `demo-lala-auth`, use demo values for the other required Firebase settings, and set `EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=127.0.0.1`. Use `10.0.2.2` for an Android emulator or your computer's LAN IP for a physical device. Emulator connections are enabled only during development and only for a `demo-` project.

On a phone, create an account, confirm its Auth user and customer document in Firebase, force-close and reopen the app, and confirm Profile still shows the customer. Then sign out, reopen again, and check that it remains signed out.
