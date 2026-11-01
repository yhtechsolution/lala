# Firebase integration: apply when ready

This update changes only web/. It implements Firebase email/password login, live
admin membership verification, guesthouse create/edit/delete, live dashboard and
analytics, and a read-only admin directory. Old demo login credentials no longer work.

## Apply the update

Extract LALA_FIREBASE_WEB.zip to C:\Users\beez\Desktop\LALA\LALA_FIREBASE_WEB.
The extracted folder must contain web/package.json and START-HERE.md directly.
If Windows adds another directory level, adjust the source path accordingly.

Run from Git Bash, one line at a time:

```bash
cd ~/lala-guesthouse-platform/git_clone_2
git status --short
```

If any local changes appear, preserve them before continuing. This package was
built from the branded version supplied in this conversation. If you or a teammate
have edited the web source since then, compare before overwriting those files.
With a clean working tree, back up tracked source (your local .env stays in place):

```bash
git archive --format=zip --output=../lala-web-before-firebase.zip HEAD web
ls /c/Users/beez/Desktop/LALA/LALA_FIREBASE_WEB/web/package.json
```

Only if the source check succeeds:

```bash
cp -rv /c/Users/beez/Desktop/LALA/LALA_FIREBASE_WEB/web/. ./web/
cd web
npm ci
npm run dev
```

The archive contains changed/new files only. Copy its web contents INTO the existing
web folder; do not delete or move your existing web folder. The archive has no .env,
so your configured local file remains. No mobile or repository-root rules are changed.

## What you can do without an admin account

The app builds, runs and displays the Firebase sign-in screen. Missing config is
shown as an actionable message. DemoUser/Demonstration123 intentionally no longer
bypass authentication. Login and writes need a real Firebase admin account.

## Before testing authenticated actions

Ask the team lead to confirm:

1. Your local web/.env holds the six values for the shared project.
2. Email/Password authentication is enabled in that project.
3. Your account exists in Firebase Authentication.
4. Firestore admins/<your exact Auth UID> exists, with email, displayName,
   createdAt (timestamp), and createdBy (the creator UID, or bootstrap).
5. The team's Firestore rules are deployed. A local firestore.rules file alone
   does not change deployed permissions.

These are console checks, not changes this package has made. Do not loosen rules
to bypass a denied login. Ask the backend owner to resolve project/rules issues.

## Local acceptance checks

- Login with an incorrect password: workspace stays closed.
- Login with an ordinary customer account: workspace stays closed; no admin document.
- Login with an admin account: workspace opens, showing that admin's display name.
- Refresh: Firebase restores the session and membership is checked again.
- Empty collection: zero statistics and an explicit empty state, without demo records.
- Add a clearly named test guesthouse with valid coordinates, contact info, HTTPS
  logo and gallery URLs. All saved listings are public; there is no draft field.
- Check Firestore for required fields, numeric price, lowercase name/city and server
  createdAt. Refresh the portal and confirm the new listing is still present.
- Edit it: ratings and createdBy/createdAt remain unchanged.
- Dashboard and analytics show the actual listing totals and city counts.
- Delete only your test listing if needed. Deletion does not cascade to favourites,
  ratings or stored image objects. Coordinate real listing deletions with the team.
- Logout: workspace closes; old localStorage demo flags grant no access.

Do not modify real guesthouses just to test. The code does not seed any sample data.

## Features deliberately limited by the shared backend contract

- Photos: existing HTTPS URLs, no file upload yet. Storage rules/path conventions
  were not supplied, so this update does not change Storage permissions.
- Users: reads admins only. The supplied customer rules deny admin access to other
  people's customer profiles. No fake customer totals, suspension or account creation.
- Communications: clear unavailable notice; no fake Sent state or delivery claim.
- Analytics: listing totals, cities, total rating counts and top rated properties.
  No invented impression, traffic, booking, payment or inquiry metrics.
- Legacy demo context/editor files remain unused for reference; active routes never
  mount them. Optional schema fields and contact extras survive listing edits.
- Security rules remain the team's responsibility. Client checks improve the UI;
  deployed rules enforce authorization. No service-account key belongs in web code.

## Validation completed here

Production build, TypeScript, nine automated tests (including deny-by-default admin
membership and schema/write tests). ESLint has no errors; Fast Refresh export
warnings are non-blocking. No live Firebase login or database write was attempted.
Browser appearance and real-project permissions need the local acceptance checks.

## Commit only after local checks

Stop dev with Ctrl+C, then:

```bash
npx tsc --noEmit
npm test
npm run lint
npm run build
cd ..
git check-ignore web/.env
git add -A -- web
git --no-pager diff --cached --name-status
```

All staged paths must start with web/. No private .env, node_modules or build
outputs should be listed. Only after reviewing:

```bash
git commit -m "Connect web admin portal to Firebase auth and guesthouse data"
git push origin simba-branch
```

If any command fails, stop and share its error. Never paste passwords or service-account keys.
