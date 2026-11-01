# Guesthouse details — issue #74

Implemented locally on `mrmalope-branch` from the [Figma Guesthouse Details frame](https://www.figma.com/design/5B4DBqIcaPxqtLWQUMdyCq/mobile-version?node-id=59-862).

Open a result in Explore or use **View Details** on a Browse/Favourites card.
The public `/guesthouse/[id]` route subscribes to that Firestore document and
updates when it changes. Back returns to the previous screen, with Browse as
the fallback for a direct link. The route does not add another bottom tab.

The screen follows the frame's 4:3 gallery, floating controls, 26px heading,
rate banner, two-column amenities, property specifications, description/rules,
location section, and fixed contact action. Original Figma SVG icons are local
assets at their intrinsic dimensions. Existing brand, fonts, colours and tab
components are reused. The contact action scrolls to the actual contact details;
phone/email actions open the device's corresponding handler. Maps opens the
stored coordinates, or the address when coordinates are absent.

Gallery navigation cycles through every valid stored image. Missing/broken
images preserve the gallery geometry and show a fallback. The record mapper
also exposes the logo, address/contact extras, rooms, check-in/out, and rules.
Missing optional fields are labelled honestly. Loading, error/retry and deleted
or missing-listing states are explicit. Favourites and ratings reuse existing
customer flows and prompt logged-out visitors to sign in.

## Deliberate data-dependent differences

The design's example property photo, map screenshot, highlights, verified-host
badge, written reviews and category scores are not fabricated for other
listings. Gallery imagery is supplied by the selected record. The location
panel presents actual coordinates and a working map link rather than a static
map of the prototype's location. Ratings show the stored aggregate; the schema
does not provide written reviews or verification claims. The shared tab bar
remains unchanged outside the detail route.

## Verification

- `npm run typecheck` from `mobile`.
- `npm run test:details` starts isolated demo emulators and checks public document
  loading, mapping, invalid/missing fields, live edits and deletion.
- Browser checks with an isolated complete sample record cover navigation from
  search, direct links, back, three-image gallery cycling including a failed
  image, contact scrolling, public fields, missing listings, offline timeout
  and successful retry after restoring connectivity.
- Screenshots reviewed at 390×844 and 320×740; no horizontal overflow. The contact
  action remains fixed above navigation while the details scroll.

No live records were written. Native device-specific phone, email and sharing
handlers still require a device smoke test.
