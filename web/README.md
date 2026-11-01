# Lala Guesthouse Admin Portal

React/TypeScript, TanStack Start and Firebase. The branded web portal now uses
Firebase email/password authentication and verifies admins/<UID> membership.

Read **FIREBASE-SETUP.md** for installation, project prerequisites, local acceptance
checks, limitations, and commands to commit only web/ to simba-branch.

```bash
npm ci
npm run dev
```

Use the team's Firebase configuration in local web/.env (six VITE_FIREBASE_ values).
No configuration values or credentials are bundled. Restart Vite after editing .env.
An Auth account plus admins/<UID> Firestore document is needed to enter the portal.

## Source map

- src/lib/firebase.ts: browser-only configuration and error messages.
- src/lib/admin-auth.tsx: Firebase session and live admin membership checks.
- src/lib/guesthouses.ts: schema validation and create/edit/delete operations.
- src/lib/live-guesthouses.ts: live subscription with loading/error/empty states.
- src/components/guesthouse-form.tsx: schema-based guesthouse editor using HTTPS image URLs.
- src/components/live-overview.tsx: real listing counts, city distribution and rating rankings.
- src/components/portal-shell.tsx: login, logo, mobile/desktop navigation and shared titles.
- src/routes/: dashboard, guesthouses, administrators, communications notice and analytics.
- src/test/: routing, membership checks and guesthouse write-contract tests.
- src/routeTree.gen.ts: framework generated; do not edit manually.

The older listing-editor.tsx and lib/portal.tsx are inactive demo references.
Active routes never render their data. Shared backend field names must remain
compatible with the schema maintained by the backend team.

## Supported and deferred

Guesthouse create/read/update/delete, dashboard/analytics and read-only admin profiles
are connected. Customer profiles are not readable under the supplied rules. Messaging,
Auth account administration and Storage uploads require additional backend support;
the portal does not pretend those features are connected. Listing images currently
use supplied HTTPS URLs. All saved listings are public; no draft field exists.

## Checks

```bash
npx tsc --noEmit
npm test
npm run lint
npm run build
```

No live project authentication, data writes or rule deployments were performed while
preparing this update. Use the acceptance checks in FIREBASE-SETUP.md before pushing.
