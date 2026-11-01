# Mobile favourites and ratings — issue #43

Guesthouse hearts now write to
`customers/{uid}/favourites/{guesthouseId}` with the shared schema's
`guesthouseId` and `addedAt` fields. Re-saving preserves the timestamp and cannot
create duplicates. Unfavouriting removes the document, including when the listing
has been deleted. Transactions make offline failures reportable instead of leaving
a queued removal waiting indefinitely for acknowledgement.

An owner-scoped listener keeps Browse, Explore, and My Favourites in sync. Account
changes immediately hide the previous customer's state and detach its listener.
Buttons wait for the saved state to load and disable during a write. My Favourites
has loading, empty, error/retry, signed-out, and unavailable-listing states. Missing
listings can still be removed from the saved list. Listings and ratings remain live.

Use **Rate your stay** on a guesthouse card to submit a whole-number score from
1 to 5. The sheet loads the customer's existing score, permits changing it, and
shows real success/error messages. A transaction reads the guesthouse summary and
the unique `ratings/{guesthouseId}_{uid}` document before writing both:

- First rating: add the score to `ratingSum` and increment `ratingCount`.
- Changed rating: add the score difference and retain `ratingCount`.
- Set `averageRating` to the new sum divided by the count.

The original rating `createdAt` is retained; `updatedAt` changes on submission.
Transactions retry concurrent edits without losing another customer's rating.
Malformed summaries or deleted listings are rejected without partial writes.
Beta's `submitRating()` implementation was not present, so the mobile service
implements the documented transaction using the existing schema and rules.

Logged-out users receive an explicit sign-in prompt for hearts and rating actions;
the service also rejects unauthenticated writes. No schema or security-rule changes
are included.

## Review locally

Run `npm run web` or `npm start` from `mobile` with the existing Firebase environment.
Sign in, save a guesthouse, and open **Favourites**. Reload to confirm persistence,
remove it from Browse or Explore, then submit/change a rating and watch the visible
average update. Signing out hides the private saved list.

All automated mutations used the isolated `demo-lala-auth` emulator project. No
production favourites or ratings were created during development.

## Validation and design

- `npm run typecheck`.
- `npm run test:engagement`: logged-out rejection, owner isolation, timestamp
  preservation, independent-client persistence, removal, integer score validation,
  first/changed ratings, concurrent transactions, malformed/deleted listings.
- Browser flows: sign-in prompts, saving/reloading/removing, initial score loading,
  live average/count updates, account switching, permission errors/retry, and deleted
  favourites. Narrow viewport and render errors are checked.
- Android production export.

Styling is external. The existing guesthouse cards, saved-stays header, and real
authentication sheets/assets are reused. **Exact comparison against Figma frames
59:1637 and 59:1152 remains outstanding:** Figma's Starter-plan MCP call quota was
exhausted, so those design contexts could not be retrieved. No claim of exact
design parity is made for the new favourites/rating UI.

#43 is kept in a separate local commit on `mrmalope-branch`, pending user review;
it is not included in the published #42 PR.
