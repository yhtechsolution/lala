# Firestore Services Guide

**Owner:** Team Beta (Database & Backend)  
**Last Updated:** 2026-10-09

## Overview

This guide documents the shared Firestore service functions created for both the web and mobile apps. These functions provide a consistent API for interacting with Firebase Firestore across both platforms.

## File Locations

- **Web:** `web/src/services/firestore.ts`
- **Mobile:** `mobile/src/services/firestore.ts`

Both files have **identical function signatures** so the same code patterns work in both apps.

## Setup Required

### 1. Environment Variables

Before using these services, create `.env` files with your Firebase credentials:

**Web (`.env`):**
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Mobile (`.env`):**
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 2. Install Dependencies

Make sure you have the Firebase SDK installed:

```bash
npm install firebase
```

## Available Functions

### Guesthouse Functions

#### `getGuesthouses(options?)`
Fetch guesthouses with optional filtering and sorting.

```typescript
import { getGuesthouses } from '../services/firestore';

// Get all guesthouses sorted by price
const guesthouses = await getGuesthouses({ sortBy: 'price', sortOrder: 'asc' });

// Filter by city
const gaboroneHouses = await getGuesthouses({ cityFilter: 'Gaborone' });

// Search by name
const results = await getGuesthouses({ searchQuery: 'Thamalakane' });

// Combine options
const topRated = await getGuesthouses({ 
  sortBy: 'rating', 
  sortOrder: 'desc',
  limitCount: 10 
});
```

**Options:**
- `cityFilter?: string` - Filter by city name
- `sortBy?: 'price' | 'rating'` - Sort by price or rating (default: 'price')
- `sortOrder?: 'asc' | 'desc'` - Sort order (default: 'asc')
- `searchQuery?: string` - Search by guesthouse name (prefix match)
- `limitCount?: number` - Limit number of results

#### `getGuesthouseById(guesthouseId)`
Get a single guesthouse by its ID.

```typescript
const guesthouse = await getGuesthouseById('WRA-BW-8821');
if (guesthouse) {
  console.log(guesthouse.name);
}
```

#### `addGuesthouse(data, adminUid)`
Create a new guesthouse. **Admin only** (enforced by security rules).

```typescript
const newGuesthouseId = await addGuesthouse({
  name: 'Sunset Lodge',
  logoUrl: 'https://...',
  galleryUrls: ['https://...'],
  description: 'Beautiful riverside retreat',
  amenities: ['WiFi', 'Pool', 'Parking'],
  location: { lat: -24.6582, lng: 25.9122 },
  pricePerNight: 850,
  city: 'Gaborone',
  country: 'Botswana',
  contact: { phone: '+267...', email: 'info@...' }
}, currentAdminUid);
```

#### `updateGuesthouse(guesthouseId, data)`
Update an existing guesthouse. **Admin only**.

```typescript
await updateGuesthouse('WRA-BW-8821', {
  pricePerNight: 950,
  amenities: ['WiFi', 'Pool', 'Parking', 'Restaurant']
});
```

#### `deleteGuesthouse(guesthouseId)`
Delete a guesthouse. **Admin only**.

```typescript
await deleteGuesthouse('WRA-BW-8821');
```

#### `getGuesthouseCount()`
Get total number of guesthouses.

```typescript
const count = await getGuesthouseCount();
console.log(`Total guesthouses: ${count}`);
```

---

### Favourite Functions

#### `addFavourite(uid, guesthouseId)`
Add a guesthouse to user's favourites.

```typescript
import { addFavourite } from '../services/firestore';

// When user clicks the favourite button
await addFavourite(currentUser.uid, 'WRA-BW-8821');
```

#### `removeFavourite(uid, guesthouseId)`
Remove a guesthouse from user's favourites.

```typescript
await removeFavourite(currentUser.uid, 'WRA-BW-8821');
```

#### `getFavourites(uid)`
Get all favourite guesthouse IDs for a user.

```typescript
const favouriteIds = await getFavourites(currentUser.uid);
// Returns: ['WRA-BW-8821', 'WRA-BW-4092', ...]
```

#### `isFavourite(uid, guesthouseId)`
Check if a guesthouse is favourited by the user.

```typescript
const isFav = await isFavourite(currentUser.uid, 'WRA-BW-8821');
console.log(isFav ? '❤️ Favourited' : '🤍 Not favourited');
```

---

### Rating Functions

#### `submitRating(uid, guesthouseId, score)` ⚠️ **Uses Transaction**
Submit or update a rating. This automatically updates the guesthouse's average rating.

```typescript
import { submitRating } from '../services/firestore';

// User gives a 5-star rating
await submitRating(currentUser.uid, 'WRA-BW-8821', 5);

// Update their rating to 4 stars
await submitRating(currentUser.uid, 'WRA-BW-8821', 4);
```

**Important:**
- Score must be an integer between 1 and 5
- Uses Firestore **transaction** to keep the guesthouse's `averageRating`, `ratingSum`, and `ratingCount` in sync
- One rating per customer per guesthouse (enforced by document ID format)

#### `getRatingsForGuesthouse(guesthouseId)`
Get all ratings for a specific guesthouse.

```typescript
const ratings = await getRatingsForGuesthouse('WRA-BW-8821');
// Returns array sorted by newest first
```

#### `getUserRating(uid, guesthouseId)`
Get a user's rating for a specific guesthouse.

```typescript
const myRating = await getUserRating(currentUser.uid, 'WRA-BW-8821');
if (myRating) {
  console.log(`You rated this ${myRating.score} stars`);
}
```

---

### Customer Functions

#### `createCustomerProfile(uid, email, displayName)`
Create a customer profile after signup.

```typescript
import { createCustomerProfile } from '../services/firestore';

// After Firebase Auth signup
await createCustomerProfile(
  user.uid,
  'customer@example.com',
  'John Doe'
);
```

#### `getCustomerProfile(uid)`
Get a customer's profile.

```typescript
const profile = await getCustomerProfile(currentUser.uid);
console.log(profile?.displayName);
```

---

### Admin Functions

#### `createAdmin(uid, email, displayName, createdByUid)`
Create a new admin account. **Existing admin only**.

```typescript
import { createAdmin } from '../services/firestore';

// Current admin creates a new admin
await createAdmin(
  newUserUid,
  'newadmin@example.com',
  'Jane Admin',
  currentAdminUid
);
```

#### `isAdmin(uid)`
Check if a user is an admin.

```typescript
const adminStatus = await isAdmin(currentUser.uid);
if (adminStatus) {
  // Show admin features
}
```

#### `getAllAdmins()`
Get list of all admins.

```typescript
const admins = await getAllAdmins();
admins.forEach(admin => {
  console.log(`${admin.displayName} (${admin.email})`);
});
```

---

## Type Definitions

All functions use TypeScript types for type safety:

```typescript
interface Guesthouse {
  id?: string;
  name: string;
  logoUrl: string;
  galleryUrls: string[];
  description: string;
  amenities: string[];
  location: { lat: number; lng: number };
  pricePerNight: number;
  city: string;
  country: string;
  contact: { phone: string; email: string };
  averageRating: number;
  ratingCount: number;
  ratingSum: number;
  createdAt: Timestamp | Date;
  createdBy: string;
  // Optional fields
  numberOfRooms?: number;
  checkInTime?: string;
  houseRules?: string;
}
```

---

## Error Handling

All functions throw errors when Firestore is not initialized or when operations fail:

```typescript
try {
  const guesthouses = await getGuesthouses();
} catch (error) {
  console.error('Failed to fetch guesthouses:', error);
  // Show error to user
}
```

---

## Security Notes

🔒 **Security rules are enforced server-side by Firestore**, not by these functions:

- ✅ **Anyone** can read guesthouses and ratings (no login required)
- ✅ **Only admins** can create/update/delete guesthouses
- ✅ **Only customers** can edit their own favourites and profile
- ✅ **Ratings** are validated: 1-5 stars only, one per customer per guesthouse

See `firestore.rules` for complete security rules.

---

## Testing Checklist

Before merging, test these scenarios:

### Guesthouses
- [ ] Fetch all guesthouses
- [ ] Filter by city
- [ ] Search by name
- [ ] Sort by price and rating
- [ ] Get single guesthouse by ID

### Favourites
- [ ] Add favourite
- [ ] Remove favourite
- [ ] Check if favourited
- [ ] Get all user favourites

### Ratings
- [ ] Submit new rating
- [ ] Update existing rating
- [ ] Verify averageRating updates correctly
- [ ] Test with multiple ratings on same guesthouse

### Admin
- [ ] Create guesthouse as admin
- [ ] Edit guesthouse as admin
- [ ] Delete guesthouse as admin
- [ ] Verify non-admin cannot edit

---

## Next Steps for Integration

1. **Replace mock data** in components with these functions
2. **Add loading states** when fetching data
3. **Handle errors** gracefully with user-friendly messages
4. **Add real-time listeners** for live updates (optional)
5. **Test on real Firebase project** with sample data

---

## Common Patterns

### Fetch and display guesthouses
```typescript
const [guesthouses, setGuesthouses] = useState<Guesthouse[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    try {
      const data = await getGuesthouses({ sortBy: 'rating', sortOrder: 'desc' });
      setGuesthouses(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

### Toggle favourite
```typescript
const toggleFavourite = async (guesthouseId: string) => {
  const isFav = await isFavourite(user.uid, guesthouseId);
  if (isFav) {
    await removeFavourite(user.uid, guesthouseId);
  } else {
    await addFavourite(user.uid, guesthouseId);
  }
};
```

### Submit rating with validation
```typescript
const handleRating = async (score: number) => {
  if (score < 1 || score > 5) {
    alert('Rating must be between 1 and 5');
    return;
  }
  
  try {
    await submitRating(user.uid, guesthouseId, score);
    alert('Rating submitted successfully!');
  } catch (error) {
    alert('Failed to submit rating');
  }
};
```

---

## Questions?

Contact Team Beta (Database & Backend) for issues related to these service functions.
