# Mobile search and filters — issue #42

The Explore tab searches the live `guesthouses` collection by name and city
in one input. Matching is case-insensitive and includes substrings (for example,
`gabo` matches Gaborone); input is trimmed and debounced by 300ms. The screen
uses the shared subscription and filters the mapped records locally. Existing
explicit Name/City prefix-query service callers remain supported.

The filter sheet supports cheapest first, highest price first, and top-rated
ordering, minimum/maximum nightly prices, and minimum guest ratings. Price bounds
are inclusive. Unrated listings are excluded when a minimum rating is selected.
Empty maximum means unlimited. The range handles move in P25 increments; numeric
fields allow exact amounts, including prices above the slider's initial P1500
ceiling. Invalid amounts and reversed bounds show an error and disable Show.
Reset All clears filters and restores cheapest-first ordering, retaining the query.

Search results are sorted and filtered locally without limits that could discard
matching records. Cheapest first is the default. Price/rating controls preserve
the query. The histogram uses all current search matches, so adjusting price bounds
does not erase the surrounding distribution. Updates remain live; listeners detach
when query settings change or the screen unmounts. Error, retry, loading, and empty
states are retained.

Browse's filter actions open the sheet; submitting Browse's text search opens
Explore with that query. Destination buttons search by city. The existing Browse
inline preview filter remains; favourites now persist through the shared #43 context.

## Design and review

The Figma Search & Filters frame `59:339` supplies the sheet, spacing, colours,
typography, original vector icons, and logo. Results use a compact variant of the shared guesthouse card with the frame's
96px image, horizontal layout, location label, title, and nightly price. Photos
remain database-driven, with an explicit fallback when unavailable. Static styling lives in external `.styles.ts`
files. The price distribution uses the current matching records, not a fabricated
histogram. Exact price inputs supplement the range handles for keyboard access.
Distance, recommendation, proximity, amenities, and voice-search controls are not
implemented by #42 and are omitted rather than displaying simulated functionality.
The existing shared navigation and result-card styling are reused.

Run `npm run web` or `npm start` from `mobile` with the existing Firebase environment.
Open Explore, try `THAB` and `GABO` in the same search input, then change the sort
and filter controls. The live project was checked read-only: one `thab` name match
and three `gab` city matches were returned. No live records were written.

Validation includes TypeScript, Firestore emulator integration tests in
`npm run test:browse`, browser flows at 390px/320px (including slider dragging),
and an Android production export. #42 is saved locally in its own commit on
`mrmalope-branch`; publishing requires the user's review and approval.

## Issue #73 Figma alignment

The implementation on `mrmalope-branch` retains the Figma Search & Filters sheet
instead of PR #88's plain list. Search results, header/search spacing, selected
histogram bars, contrasting range handles, and the live price-range badge follow
frame `59:339`. Numeric price inputs remain keyboard-editable inline bounds.
The sheet scrolls on phone-sized viewports while keeping its action visible.
Distance, proximity, recommendation, voice search, and amenities are still outside
this issue; the shared tab bar is unchanged. This is alignment of #73's supported
controls, not an implementation of every feature pictured in the design.
