# Draft and hidden listings

Each guesthouse has an optional `status`: **published**, **draft** or **hidden**.

- **Published:** shown to customers in the mobile app.
- **Draft:** being prepared; not shown.
- **Hidden:** taken down temporarily without deleting it; not shown.
- **Missing status** (listings created before this field existed) counts as published, so nothing disappears when this is deployed.

## Web portal
- The add/edit form has a **Visibility in the app** selector. New listings default to Published.
- The Listings page shows a status badge on every listing, a **Show** filter with counts, and a one-click **Hide / Publish** button.

## Mobile app
Only published listings reach the app: every list, search, sort, the similar-stays row, compare, recently viewed, and the detail page all use one check in `services/guesthouses.ts`. A draft or hidden listing opened from an old link shows as not found. Any unrecognised status value is treated as not published.

## Security rules
- `status` must be one of the three values when present (admins only can write it).
- Customers cannot rate a draft or hidden listing.

## Known limit
Hiding is enforced by the app, not by the database: the listing is still readable through the Firestore API by anyone who knows its ID, because the rules allow public reads of `guesthouses`. This is fine for listing information that is meant to be public, but do not put anything secret in a draft. Making hidden listings truly unreadable needs the rules to check `status` on read, which in turn requires every app query to filter on `status`, composite indexes, and a one-time backfill of `status: "published"` on existing documents.
