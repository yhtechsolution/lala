# Live Browse — issue #41

Browse subscribes to the public `guesthouses` collection with
`orderBy('pricePerNight', 'asc')`. No shared `getGuesthouses()` service was
present, so the mobile service queries Firestore directly.

Cards show stored names, locations, descriptions, amenities, prices, and
rating aggregates. Photos use the first valid gallery URL, then `logoUrl`.
Missing or failed images show a neutral photo-unavailable state. Invalid names
or prices are skipped; Firestore excludes documents without the ordered field.
Top-rated cards and destination counts also come from the same live records.

The existing Figma-based card and screen layout is retained. Prototype state
switches, sample listings, fabricated distances and verification labels are
removed. Loading, empty, search-no-match, and retryable errors appear only when
those conditions occur. An empty initial cache waits for the server; a connection
that never returns a result produces a retryable error after 15 seconds.

## Review locally

Use the existing `mobile/.env` Firebase configuration:

```sh
cd mobile
npm run web
```

Or run `npm start` and open Expo Go. Browse is publicly readable and does not
require signing in. The live project was checked read-only and returned
Thabo's Lodge in Gaborone at P450. No live test records were written.

## Validation

- `npm run typecheck`
- `npm run test:browse` — isolated demo emulator: empty collection, public reads,
  price ordering, malformed data, photo mapping, live edits and deletions.
- Browser checks at 390px and 320px: error/retry, empty collection, real cards,
  live reordering, missing photos, no-match search and clearing it, and deletions.
- Offline demo preview: loading indicator followed by connection timeout.
- Android production bundle exported successfully.

Browse's inline search remains a local text filter; Explore's Firestore prefix
search and sort controls are implemented by #42. Favourites persist in Firestore
through #43. The existing View Details control is unchanged and does not yet open
a details screen.

This issue is a separate local commit on `mrmalope-branch`. It must not be pushed
or added to a PR until the user's review is approved.
