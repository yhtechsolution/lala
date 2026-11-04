# Extra features

## Nearest to me (mobile)
Choosing **Nearest to Me** in the sort sheet asks for location permission, then sorts by straight-line distance and shows "3.2 km away" on each result. Guesthouses without a saved map position go last. If the traveller already allowed location for the Map View, that position is reused instead of asking again. If permission is denied or location is off, the list shows cheapest first and says so. Location is used only for sorting and is never stored.
Setup: run `npx expo install expo-location` in `mobile/` and add the plugin to `app.json`:
```json
["expo-location", { "locationWhenInUsePermission": "Lala uses your location to sort guesthouses by distance. It is never stored." }]
```

## Setswana descriptions
Admins can paste or write a Setswana description in the guesthouse form, or press **Translate to Setswana with AI** to draft it from the English text. The AI output must be checked by a Setswana speaker before saving. The field is optional (`descriptionTn`, max 2000 characters, enforced by the security rules). On the mobile detail page an English/Setswana toggle appears only when the field exists.

## Similar stays
The detail page lists up to 3 similar guesthouses, ranked by same city (strongest), closeness in price, shared amenities and similar ratings. Listings below a similarity threshold are not suggested.

## Compare
**Compare with another stay** on the detail page opens a side-by-side view: price, rating, number of ratings, city and amenity counts, with the better side marked, plus shared and unique amenities. A rating is only called better when both guesthouses have been rated.

## Recently viewed (mobile)
Opening a guesthouse records it on the device. Browse shows a **Recently viewed** row (up to 6, newest first) when no search or city filter is active, with a **Clear** button. The list is stored in the phone's local storage only, holds at most 10 ids, is not tied to an account, and guesthouses that no longer exist are skipped.

## Tests
`npm run test:features` and `npm run test:recent` in `mobile/` (add `"test:features": "node tests/nearby-similar-compare.test.mjs"` and `"test:recent": "node tests/recently-viewed.test.mjs"` to the scripts). `npm test` in `web/` covers the translation prompt and the form. The rules tests in `backend/` cover the optional `descriptionTn` field.
