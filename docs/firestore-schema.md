# Lala — Firestore Schema

Owner: Team Beta. Consumers: Team Alpha (web), Team Charlie (mobile), Team Delta (entity diagram).
Any change to this document must be announced to all teams, because field names are shared by both apps.

## Collections at a glance

```
guesthouses/{guesthouseId}
admins/{uid}
customers/{uid}
  └── favourites/{guesthouseId}      (subcollection)
ratings/{guesthouseId}_{customerUid}
```

`{uid}` is the Firebase Authentication user ID, so a person's Auth account and their Firestore document always share the same ID.

---

## 1. `guesthouses/{guesthouseId}`

Written by admins (web). Read by everyone (web and mobile, no login required).

| Field | Type | Required | Notes |
|---|---|---|---|
| name | string | yes | Display name |
| nameLower | string | yes | Lowercase copy of name, used for search |
| logoUrl | string | yes | URL of the logo image |
| galleryUrls | array of string | yes | URLs of gallery images |
| description | string | yes | |
| descriptionTn | string | no | Optional Setswana description (max 2000 characters), written or reviewed by an admin. Mobile shows a language toggle when present |
| status | string | no | `published`, `draft` or `hidden`. Missing means published. Only published listings are shown in the mobile app |
| amenities | array of string | yes | e.g. ["WiFi", "Parking", "Pool"] |
| location | map `{ lat: number, lng: number }` | yes | Google Maps coordinates |
| pricePerNight | number | yes | Stored as a number so it can be sorted |
| city | string | yes | |
| cityLower | string | yes | Lowercase copy of city, used for search |
| country | string | yes | |
| contact | map `{ phone: string, email: string }` | yes | Extra keys (e.g. address) allowed |
| averageRating | number | yes | 0 when unrated. Used for sorting and the dashboard |
| ratingCount | number | yes | 0 when unrated |
| ratingSum | number | yes | 0 when unrated. averageRating = ratingSum / ratingCount |
| createdAt | timestamp | yes | Use `serverTimestamp()` |
| createdBy | string | yes | UID of the admin who registered it |
| numberOfRooms | number | no | Optional extra |
| checkInTime | string | no | Optional extra |
| houseRules | string | no | Optional extra |

**Why the lowercase fields:** Firestore has no "contains" search. Searching with a lowercase prefix (`where('nameLower', '>=', q)` and `'<=', q + '\uf8ff'`) works for name and city. Alpha must set `nameLower` and `cityLower` on every save.

**Why the rating summary lives here:** the mobile app needs to sort by rating and the dashboard needs the top-rated guesthouse. Storing `averageRating` on the guesthouse means both are a single query instead of reading every rating.

---

## 2. `admins/{uid}`

Written by admins only. The existence of a document here is what makes a user an admin.

| Field | Type | Notes |
|---|---|---|
| email | string | |
| displayName | string | |
| createdAt | timestamp | |
| createdBy | string | UID of the admin who created this account, or "bootstrap" for the first admin |

The **first admin** is created manually (see the rules file for the steps). After that, admins create further admins from the web portal.

---

## 3. `customers/{uid}`

Written by the customer themselves at signup. Readable only by that customer.

| Field | Type | Notes |
|---|---|---|
| email | string | |
| displayName | string | |
| createdAt | timestamp | |

### 3a. `customers/{uid}/favourites/{guesthouseId}`

The document ID is the guesthouse ID, so favouriting twice can't create duplicates. Unfavouriting deletes the document.

| Field | Type | Notes |
|---|---|---|
| guesthouseId | string | Same as the document ID |
| addedAt | timestamp | |

---

## 4. `ratings/{guesthouseId}_{customerUid}`

The document ID is the guesthouse ID and customer UID joined with an underscore. This guarantees **one rating per customer per guesthouse**, and changing a rating overwrites the old one.

| Field | Type | Notes |
|---|---|---|
| guesthouseId | string | |
| customerId | string | Must equal the signed-in user's UID |
| score | number | Whole number from 1 to 5 |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### How submitting a rating works (Team Charlie)

Use a Firestore **transaction** so the rating and the guesthouse summary never disagree:

1. Read the guesthouse document, and read the customer's existing rating if there is one.
2. New rating: `ratingSum += score` and `ratingCount += 1`.
   Changed rating: `ratingSum += (newScore - oldScore)` and `ratingCount` stays the same.
3. Recompute `averageRating = ratingSum / ratingCount`.
4. Write the rating document and update the three summary fields on the guesthouse.

---

## Relationships (for the entity diagram)

- One **admin** registers many **guesthouses** (`guesthouses.createdBy` → `admins.uid`).
- One **admin** creates many **admins** (`admins.createdBy` → `admins.uid`).
- One **customer** has many **favourites**, and each favourite points to one **guesthouse**.
- One **customer** gives many **ratings**, and each rating points to one **guesthouse**.
- Guesthouse to customer is many-to-many, resolved by the `ratings` collection (and by `favourites`).

## Dashboard queries (Team Alpha)

Firestore cannot aggregate on the server without Cloud Functions, so the dashboard computes on the client:

- **Total guesthouses:** `getCountFromServer(collection(db, 'guesthouses'))`
- **City with the most guesthouses:** fetch all guesthouses, count by `city` in JS, take the highest.
- **Most highly rated:** `orderBy('averageRating', 'desc'), limit(1)`. Only consider guesthouses with `ratingCount > 0`.
- **Optional extras:** average price per city, guesthouses added this month (`createdAt`).

## Search and sort (Team Charlie)

- **Default:** `orderBy('pricePerNight', 'asc')` (cheapest first).
- **Sort by rating:** `orderBy('averageRating', 'desc')`.
- **Search:** prefix query on `nameLower` or `cityLower`. Combining a search with a different sort can require a composite index. Firestore prints a link in the console error that creates it in one click.
