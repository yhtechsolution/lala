# Lala web portal update notes

This archive contains the complete updated `web/` folder for the `simba-branch` source supplied by the user. It does not contain a Git commit and has not been pushed.

## Included changes

- Guesthouse management now uses **Suspend** and **Reactivate** instead of permanent deletion. The Firestore document remains in place; status changes record a server timestamp and the current admin UID. Legacy records with no `status` remain active.
- Suspended guesthouses are hidden from the web discovery map but remain visible in the admin Guesthouses page with their status and a reactivation action.
- The sidebar's Administrators entry is now **End Users**. The page groups guesthouses by their existing `createdBy` UID and shows each creator's listing portfolio.
- The top-right profile/avatar opens a menu with **Account settings** and **Sign out**. The standalone My account sidebar item has been removed.
- Guesthouse image handling was not changed. Existing HTTPS URL fields remain as they were.

## Important backend limitations

- The current data contract defines `createdBy` as the admin UID that created a guesthouse. It does **not** prove that the admin is the guesthouse lister or owner. The page labels these as listing creators and does not claim otherwise.
- There is no admin-readable customer profile collection or trusted Firebase Authentication directory endpoint in the supplied project. Therefore this archive cannot safely display every customer or verified lister account, their names/emails, or a complete end-user list. The backend team must provide an approved profile schema plus Firestore rules, or a secured Cloud Function using Firebase Admin SDK, and a verified relationship between lister accounts and guesthouses.
- The web discovery map filters suspended records. The mobile customer app must also filter `status === "suspended"` for suspension to hide listings across the whole platform. The mobile project was intentionally not included in this web-only archive.
- Confirm the deployed Firestore rules allow admins to update the status fields. Frontend code cannot grant permissions.

## Validation

`npm ci` could not complete in the packaging environment because dependency downloads timed out, and the offline cache did not contain all required packages. Consequently, TypeScript, Vitest, lint and production build have **not** been rerun against these changes. Run `npm ci`, `npx tsc --noEmit`, `npm test`, `npm run lint`, and `npm run build` locally before pushing.

## Safe application

Extract this archive and copy its `web/` folder contents over your repository's existing `web/` folder. Keep your local ignored `web/.env`; it is not included here. Review `git status` and `git diff` before staging. No mobile files, root files, `.env`, `node_modules`, or build output are included.
