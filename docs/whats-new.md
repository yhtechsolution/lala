# What is new in this package

This package is the new main with every feature below re-applied on top of it. See `merge-report.md` for what came from where and what to check.

## Web admin portal
- **AI description assistant** and **AI dashboard summary** (Firebase AI Logic, free tier). See `ai-features.md`.
- **Setswana description** field with an AI translate button.
- **Add an administrator** on the Users page, using a temporary second Firebase app. See `admin-creation.md`.
- **Draft / hidden / published** status with filter and Hide/Publish button. See `draft-hidden-status.md`.

## Mobile app
- **Smart search** (sentence to filters, with a built-in fallback). See `smart-search.md`.
- **Nearest to me** sort, **similar stays**, **compare two stays**, English/Setswana toggle, **recently viewed**. See `extra-features.md`.
- **Dark mode** with a phone-setting default. See `dark-mode.md`.
- Only published listings are shown.

## Backend (repo root)
- Hardened `firestore.rules`: rating integrity (a customer can only change a guesthouse's rating summary together with their own rating), validated documents, admin-only creation of admins, optional `descriptionTn` and `status`.
- `firebase.json`, `package.json`, `.firebaserc`, `vitest.config.js`, `storage.rules`, and `tests/rules.test.js` (emulator tests). `firebase.auth-test.json` is still used by the mobile tests.

## Set up
1. `npm install` in the repo root, `web/` and `mobile/` (the mobile install adds `expo-location`).
2. Firebase console: enable **AI Logic** (Gemini Developer API) and keep the project on the free plan.
3. Deploy the rules after the rules tests pass: `npm run deploy:rules` in the repo root.
4. Optional: App Check for the web app (`ai-features.md`).

## Run the tests
| Where | Command | Needs |
|---|---|---|
| `web/` | `npm test` | nothing extra |
| `mobile/` | `npm run test:smart`, `test:features`, `test:recent`, `test:status`, `test:theme`, `test:search` | nothing extra |
| repo root | `npm test` | Node and Java (starts the Firestore emulator) |
| `mobile/` | `npm run test:auth` and the other emulator tests | Java and the existing emulator setup |

## Honest limits
- The emulator tests (rules and mobile emulator tests) were written but not run by the author of this package.
- The AI calls, the location prompt and the look of dark mode have not been checked on a real device or against the real Firebase project.
- Hidden listings are hidden by the apps, not by the database rules (see `draft-hidden-status.md`).
