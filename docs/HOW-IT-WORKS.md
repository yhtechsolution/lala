# How Lala works and how to run it

## The big picture
Two apps share one Firebase project. Admins use the **web portal** to write data; customers use the **mobile app** to read it. Nothing runs on your own server.
- **Authentication**: sign-in for admins (web) and customers (mobile).
- **Firestore**: the database. Main collections: `guesthouses`, `admins`, `favourites`, `ratings` and customer engagement records.
- **firestore.rules**: decides who may read or write. Admins (a document in `admins/<uid>`) manage listings; customers can only read published listings and manage their own favourites/ratings.

## Run it
1. `cd web && npm install`, then `cd ../mobile && npm install`.
2. `web/.env`: copy `.env.example` and fill the Firebase values (`VITE_FIREBASE_*`). Add `VITE_GEMINI_MODEL` if the AI buttons fail on the default model. Optional: `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET` (an unsigned preset) for photo upload.
3. `mobile/.env`: copy `.env.example`, same Firebase project, keys start `EXPO_PUBLIC_`.
4. First admin (once): Firebase console -> Authentication -> add a user, copy the UID, then Firestore -> create `admins/<UID>` with `email`, `displayName`, `createdAt`, `createdBy: "bootstrap"`. After that, admins can add more from the Users page.
5. Deploy rules: `firebase deploy --only firestore:rules,storage` (needed after this merge).
6. Web: `cd web && npm run dev`, open the printed address and sign in.
7. Mobile: `cd mobile && npx expo start`, scan the QR code with Expo Go.

## Web portal
- `src/routes/*`: one file per page (Dashboard `index`, Listings, Discovery, Analytics, Communications, Users, Account).
- `components/portal-shell.tsx`: shows the sign-in form until an admin is signed in, then the sidebar.
- `lib/guesthouses.ts`: create/edit/suspend listings. `lib/live-guesthouses.ts`: live updates via `onSnapshot`. `lib/ai.ts`: Gemini helpers (description draft, Setswana translation, dashboard summary).
- Listings: Add/Edit opens the form at the top; Suspend hides a listing from customers without deleting it.

## Mobile app
- `src/app/*`: one file per screen (Home `index`, Explore `search`, Favourites, Profile `login`, details `guesthouse/[id]`, `compare`).
- `services/guesthouses.ts` reads Firestore and keeps only published listings; filtering, sorting, distance and amenity matching are plain functions that are easy to test.
- Explore: search, filters, smart (AI) search, list or map view, sort including Nearest to me.
- Details: photos, Setswana/English description, map, directions, contact, ratings, similar stays, compare.
- Settings: Appearance (light/dark/system) on the Profile tab.

## Testing
`web`: `npm test`, `npm run typecheck`. `mobile`: the `test:*` scripts. Rules tests: from the repo root (needs Java for the emulator).
