# Lala Backend: Study and Presentation Guide

Read this top to bottom once, then use section 9 to rehearse.

## 1. What "the backend" is in this project

There is no server you wrote. The backend is four Firebase services plus one file of rules:

| Piece | What it does here |
|---|---|
| Firebase Authentication | Stores accounts and checks email/password. Both apps use it. |
| Cloud Firestore | The NoSQL database. Holds guesthouses, admins, customers, favourites, ratings. |
| Security rules (`firestore.rules`) | The only thing that decides who may read or write each document. This is your "server-side logic". |
| Cloud Storage | Image hosting. Not used yet: the apps store image URLs. |

The web and mobile apps talk to Firestore directly through the Firebase SDK. Because there is no server in between, **the rules are the only protection**. Anything the app code checks (a button hidden, a validation message) can be bypassed by someone using the SDK directly. Rules cannot.

Why this satisfies "backend of your choice": Firebase is a Backend-as-a-Service. Authentication, database and access control are provided and configured, not hand-coded. Your contribution is the data model, the rules, the tests and the project configuration.

## 2. Data model

```
guesthouses/{guesthouseId}
admins/{uid}
customers/{uid}
  favourites/{guesthouseId}
ratings/{guesthouseId}_{customerUid}
```

- `{uid}` is the Firebase Authentication user ID. The account and its Firestore document share one ID.
- Being an admin means one thing: a document exists at `admins/<your uid>`. There is no role field.
- The `favourites` document ID is the guesthouse ID, so saving twice overwrites instead of duplicating.
- The `ratings` document ID is guesthouse ID + underscore + customer UID, so one customer has exactly one rating per guesthouse.
- Each guesthouse stores `ratingSum`, `ratingCount` and `averageRating`. Storing the summary on the guesthouse lets the app sort by rating and the dashboard find the top guesthouse with one query instead of reading every rating.
- `nameLower` and `cityLower` exist because Firestore has no "contains" search. A prefix query on the lowercase copy gives case-insensitive search.

## 3. How login and roles work

1. Everyone logs in with Firebase Authentication (email and password).
2. The web portal then listens to `admins/<uid>`. If the document exists the workspace opens; if not, it stays closed.
3. The mobile app creates `customers/<uid>` at sign-up.
4. The first admin is created by hand in the console, because rules only let an existing admin create admins. Console edits bypass rules, which is why this works.

## 4. The rules, section by section

**Helper functions** (top of the file)
- `isSignedIn()` checks `request.auth != null`.
- `isOwner(uid)` checks the caller's UID equals the document's UID.
- `isAdmin()` checks that `admins/<caller uid>` exists, using `exists()`.
- `untouched(fields)` is true when none of the listed fields differ between the stored document and the incoming one. It uses `diff().affectedKeys()`.

**Key vocabulary**
- `resource.data` is the document as stored now. `request.resource.data` is the document as it will be after the write.
- `exists()` and `get()` read the database as it is before the write. `existsAfter()` and `getAfter()` read it as it will be after the whole transaction or batch finishes.
- `request.time` is the server time. A client field set with `serverTimestamp()` equals `request.time`, which proves the client did not forge a date.
- A rule that errors (for example reading a field that is missing) counts as a denial. Rules fail closed.

**Guesthouses**
- Anyone can read, so browsing works without an account.
- Create: admin only, and the document must be complete and valid: required fields present, types correct, price not negative, coordinates in range, lowercase fields matching the real name and city, rating summary starting at zero, `createdBy` equal to the caller, `createdAt` equal to server time.
- Update: two separate paths joined with OR.
  - Admin path: edits allowed, but never to the rating summary, `createdAt` or `createdBy`, and the result must still be valid.
  - Customer path: only the three rating summary fields may change, and only under the rating-integrity condition in section 5.
- Delete: admin only.
- Optional fields: `descriptionTn` (a Setswana description, at most 2000 characters) and `status` (`published`, `draft` or `hidden`; missing counts as published). Only admins can write them.

**Admins**: readable by admins and by the owner (needed at login). Create only by an existing admin, with exactly four fields and the creator recorded. Update may only change `displayName`. Never deletable from the client.

**Customers**: only the owner can read or write. Create allows exactly `email`, `displayName`, `createdAt`, and the email must match the login's own email. Update may only change `displayName`. Favourites: owner only, the document must point at its own ID, and the guesthouse must exist.

**Ratings**: readable by anyone. A write must satisfy `validRating()`: the document ID matches guesthouse ID + caller UID, `customerId` is the caller, score is a whole number from 1 to 5, the guesthouse exists and is published (a draft or hidden listing cannot be rated), and the summary matches (section 5). Existing ratings cannot change `createdAt`. No deletes.

## 5. The finding to lead with: rating integrity

**Original rule.** A customer could update a guesthouse if the only fields changed were `ratingSum`, `ratingCount` and `averageRating`. It checked which fields changed, never what they changed to.

**Consequence.** Any signed-in user could write any value to those three fields on any guesthouse directly, bypassing the app, for example setting a 5.0 average with 9,999 ratings. That corrupts the sort-by-rating screen and the dashboard's most highly rated guesthouse.

**Fix.** A customer's change to the summary is accepted only when it matches their own rating write in the same transaction. The `summaryMatchesRating()` function compares before and after:
- `ratingCount` after equals before, plus 1 if this customer had no rating yet, plus 0 if they did.
- `ratingSum` after equals before, minus their old score (0 if none), plus their new score.
- `averageRating` equals `ratingSum / ratingCount` within a tiny tolerance for floating point.

The same check runs on the rating document too, so a rating cannot be written without the matching summary update. This works because the app already writes both in one transaction, and `getAfter()` lets the rules see the result of the whole transaction.

Honest limit: a customer can still re-submit their own legitimate rating as often as they like; that only changes their own score. Another limit: rules cannot stop fake accounts, only one account's influence.

## 6. Other fixes in this update

| Problem | Fix |
|---|---|
| No `firebase.json`, emulator not configured | `firebase.json` points to the rules and configures the emulator |
| No `package.json`, `npm test` could not run | `package.json` with scripts and dev dependencies |
| Tests hit the live project with real accounts | 40 automated tests on the local emulator, fresh data every test |
| Admin could edit rating summary or creator | `untouched()` blocks it |
| Incomplete guesthouse documents vanish from sorted queries | `validGuesthouse()` requires every field |
| Customer profile accepted any fields | Exactly three fields, email must match the login |
| No Storage rules | `storage.rules`: images public to read, admin-only writes, under 5 MB, images only |

## 7. How to run and deploy

You need Node.js and Java (the emulator is a Java program; use JDK 21 if the emulator complains about the version).

```bash
npm install
npm test                  # starts the emulator, runs 40 tests, shuts it down
npm run emulators         # optional: emulator with a web UI at localhost:4000
```

To publish rules to the real project (after tests pass):

```bash
npx firebase login
npx firebase deploy --only firestore:rules
```

Deploying is separate from editing. Changing `firestore.rules` in the repo changes nothing in production until it is deployed. Cloud Storage may need a paid plan on new projects, so check the Storage page in the console before deploying `storage.rules`.

Read the first failing test carefully if anything fails. A test written wrong and a rule written wrong look the same until you read the message.

## 8. Known gaps (say these yourself before anyone asks)

- Admin creation works through a temporary second Firebase app, so there is no Cloud Function and no change of plan. A half-finished creation (login made, admin access refused) is recoverable by retrying with the same email and password. Admins cannot be removed or disabled from the portal; that would need a trusted backend.
- Deleting a guesthouse leaves its ratings and favourites behind.
- Hidden and draft listings are hidden by the apps, not by the rules: `guesthouses` is publicly readable. Hiding them in the database would need status-aware read rules, filtered app queries, composite indexes and a backfill.
- Ratings are publicly readable and contain customer UIDs.
- The rules tests were written but I could not run them in my environment, so run them yourself first. Existing guesthouse documents entered by hand may lack required fields and will be rejected on edit until fixed.

## 9. Presentation outline (about 3 minutes for your part)

1. **Role (15 s).** I own the database, authentication and security rules.
2. **Architecture (30 s).** Two apps, one Firebase project, no custom server. Rules are the only access control.
3. **Data model (30 s).** Five collections; admin status is a document; one rating per customer per guesthouse by document ID.
4. **Security (60 s).** Public read, admin-only write, customers touch only their own data. Then the rating-integrity finding and fix.
5. **Testing (30 s).** 40 emulator tests covering every collection, including attack attempts. Run `npm test` live.
6. **Gaps and next steps (15 s).** Admin creation screen, cascade deletes.

## 10. Questions you may be asked, and how to answer

- **Why Firebase and not Node?** Both apps share one database and login without us building and hosting a server; the brief allows any backend and NoSQL database.
- **How do you stop a customer becoming an admin?** Only an existing admin can create `admins/<uid>`, and customers cannot write to that collection. A test covers it.
- **How do you stop fake ratings?** Summary changes must equal the customer's own rating change, checked before and after the transaction.
- **Why NoSQL?** The brief requires it, and the data is read as whole documents with simple sorts.
- **What would you do with more time?** Cloud Functions to maintain summaries and cascade deletes, which needs a paid plan.
- **What is `getAfter`?** A rules function that reads the document as it will be once the whole transaction finishes.
