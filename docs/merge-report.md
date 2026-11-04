# Merge report (main + merged)

Two packages were combined: the team's newer `main` and the earlier `merged` package with the AI, add-administrator, draft/hidden status, dark mode, compare and similar-stays work.

Nothing here was compiled in the environment that did the merge (no network). Run `npm install`, `npm run typecheck`/`npm test` in `web/` and `mobile/` first and fix anything they report.

## Web (base: merged)
- From main: admin sign-in gate, profile menu, Cloudinary photo upload (used in the guesthouse form when `VITE_CLOUDINARY_*` are set, otherwise HTTPS URL fields), listing-creators list, discovery map hides non-published listings.
- Kept from merged: AI features, Add an administrator, dark mode, dashboard.
- Users page shows both Administrators (with Add) and Listing creators.
- Status: Published / Draft / Suspended with Suspend and Reactivate buttons that store `statusChangedAt` and `statusChangedBy`. No permanent delete. Older `active` and `suspended` values are read as published and hidden (web, mobile, rules).

## Mobile (base: main)
- From main: redesigned Explore map, card layouts, haptics, reduced motion, amenity matching, swipe helper.
- Re-applied from merged: dark mode (all styles converted), Appearance setting, Nearest to me sort, distance label, compare, similar stays, recently viewed, Setswana toggle, published-only filtering.

## Bugs fixed
- Edit on Listings did nothing: the form opens above the list; it now scrolls into view.
- "The AI could not complete this request" hid specific messages; input problems now show as written.
- Cloudinary files broke strict TypeScript (`import.meta.env.X`, `urls[0]`).
- Form note said there was no draft/published field.
- Optional undefined fields were sent to Firestore on save.
- Firestore rules and tests updated for the status aliases and audit fields.
