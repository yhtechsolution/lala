# Manual Guide: Adding Sample Guesthouse Data to Firebase Console

**Owner:** Team Beta (Database & Backend)  
**Date:** 2026-10-09

## Prerequisites

1. Access to Firebase Console: https://console.firebase.google.com
2. Admin access to the project: `lala-guesthouse-platform`
3. First admin user already created (see firestore.rules for bootstrap instructions)

---

## Method 1: Using Firebase Console (Recommended for First Time)

### Step 1: Navigate to Firestore

1. Open Firebase Console
2. Select your project: `lala-guesthouse-platform`
3. Go to **Firestore Database** from the left sidebar
4. Click **Start collection** (if this is your first collection)

### Step 2: Create the `guesthouses` Collection

Click **+ Start collection** and enter collection ID: `guesthouses`

---

## Sample Guesthouse #1: Thamalakane River Lodge (Maun)

Click **Add document** and use **Auto-ID**, then add these fields:

| Field | Type | Value |
|-------|------|-------|
| name | string | `Thamalakane River Lodge` |
| nameLower | string | `thamalakane river lodge` |
| logoUrl | string | `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400` |
| galleryUrls | array | Add 3 strings:<br>`https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800`<br>`https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800`<br>`https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800` |
| description | string | `Nestled along the serene Thamalakane River, this lodge offers a tranquil escape with stunning river views.` |
| amenities | array | Add strings: `WiFi`, `Swimming Pool`, `Restaurant`, `Bar`, `Game Drives` |
| location | map | Add fields:<br>• `lat` (number): `-19.9858`<br>• `lng` (number): `23.4166` |
| pricePerNight | number | `1100` |
| city | string | `Maun` |
| cityLower | string | `maun` |
| country | string | `Botswana` |
| contact | map | Add fields:<br>• `phone` (string): `+267 686 0022`<br>• `email` (string): `info@thamalakane.co.bw` |
| averageRating | number | `0` |
| ratingCount | number | `0` |
| ratingSum | number | `0` |
| createdAt | timestamp | Click "Set to current time" |
| createdBy | string | `YOUR_ADMIN_UID` (copy from Authentication tab) |
| numberOfRooms | number | `18` |
| checkInTime | string | `14:00` |
| houseRules | string | `No smoking indoors. Quiet hours after 22:00.` |

**Click Save**

---

## Sample Guesthouse #2: The Acacia Urban Guesthouse (Gaborone)

Add another document with Auto-ID:

| Field | Type | Value |
|-------|------|-------|
| name | string | `The Acacia Urban Guesthouse` |
| nameLower | string | `the acacia urban guesthouse` |
| logoUrl | string | `https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400` |
| galleryUrls | array | `https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800`<br>`https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800` |
| description | string | `Modern urban retreat in the heart of Phakalane, offering stylish accommodation.` |
| amenities | array | `WiFi`, `Air Conditioning`, `Parking`, `Breakfast Included` |
| location | map | `lat`: `-24.5792`, `lng`: `25.9231` |
| pricePerNight | number | `750` |
| city | string | `Gaborone` |
| cityLower | string | `gaborone` |
| country | string | `Botswana` |
| contact | map | `phone`: `+267 391 2345`, `email`: `reservations@acaciaguesthouse.co.bw` |
| averageRating | number | `0` |
| ratingCount | number | `0` |
| ratingSum | number | `0` |
| createdAt | timestamp | Set to current time |
| createdBy | string | `YOUR_ADMIN_UID` |
| numberOfRooms | number | `12` |

---

## Sample Guesthouse #3: Chobe Riverside Retreat (Kasane)

| Field | Type | Value |
|-------|------|-------|
| name | string | `Chobe Riverside Retreat` |
| nameLower | string | `chobe riverside retreat` |
| logoUrl | string | `https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400` |
| galleryUrls | array | `https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800` |
| description | string | `Experience the majesty of the Chobe River with breathtaking views.` |
| amenities | array | `WiFi`, `Pool`, `Restaurant`, `Safari Tours`, `Sunset Cruises` |
| location | map | `lat`: `-17.7948`, `lng`: `25.1631` |
| pricePerNight | number | `950` |
| city | string | `Kasane` |
| cityLower | string | `kasane` |
| country | string | `Botswana` |
| contact | map | `phone`: `+267 625 0088`, `email`: `stay@choberiverside.co.bw` |
| averageRating | number | `0` |
| ratingCount | number | `0` |
| ratingSum | number | `0` |
| createdAt | timestamp | Set to current time |
| createdBy | string | `YOUR_ADMIN_UID` |
| numberOfRooms | number | `24` |

---

## Sample Guesthouse #4: Kalahari Sands Suite (Francistown)

| Field | Type | Value |
|-------|------|-------|
| name | string | `Kalahari Sands Suite` |
| nameLower | string | `kalahari sands suite` |
| logoUrl | string | `https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400` |
| galleryUrls | array | `https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800` |
| description | string | `Comfortable and affordable accommodation in Francistown.` |
| amenities | array | `WiFi`, `Parking`, `Air Conditioning`, `Breakfast` |
| location | map | `lat`: `-21.1671`, `lng`: `27.5146` |
| pricePerNight | number | `580` |
| city | string | `Francistown` |
| cityLower | string | `francistown` |
| country | string | `Botswana` |
| contact | map | `phone`: `+267 241 7890`, `email`: `info@kalaharisands.co.bw` |
| averageRating | number | `4.6` |
| ratingCount | number | `3` |
| ratingSum | number | `14` |
| createdAt | timestamp | Set to current time |
| createdBy | string | `YOUR_ADMIN_UID` |

**Note:** This one has ratings pre-set for testing purposes!

---

## Sample Guesthouse #5: Tswapong Hills Eco-Stay (Palapye)

| Field | Type | Value |
|-------|------|-------|
| name | string | `Tswapong Hills Eco-Stay` |
| nameLower | string | `tswapong hills eco-stay` |
| logoUrl | string | `https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400` |
| galleryUrls | array | `https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800` |
| description | string | `Eco-friendly guesthouse near the stunning Tswapong Hills.` |
| amenities | array | `WiFi`, `Eco-Friendly`, `Hiking Trails`, `Solar Power` |
| location | map | `lat`: `-22.5501`, `lng`: `26.8042` |
| pricePerNight | number | `420` |
| city | string | `Palapye` |
| cityLower | string | `palapye` |
| country | string | `Botswana` |
| contact | map | `phone`: `+267 492 1234`, `email`: `bookings@tswapongeco.co.bw` |
| averageRating | number | `0` |
| ratingCount | number | `0` |
| ratingSum | number | `0` |
| createdAt | timestamp | Set to current time |
| createdBy | string | `YOUR_ADMIN_UID` |
| numberOfRooms | number | `8` |

---

## Step 3: Add Sample Ratings (Optional - for Testing)

Create a `ratings` collection and add a few ratings for the Kalahari Sands Suite to test the rating system:

### Rating 1
**Document ID:** `<KALAHARI_GUESTHOUSE_ID>_testuser1`

| Field | Type | Value |
|-------|------|-------|
| guesthouseId | string | `<KALAHARI_GUESTHOUSE_ID>` |
| customerId | string | `testuser1` |
| score | number | `5` |
| createdAt | timestamp | Set to current time |
| updatedAt | timestamp | Set to current time |

### Rating 2
**Document ID:** `<KALAHARI_GUESTHOUSE_ID>_testuser2`

| Field | Type | Value |
|-------|------|-------|
| guesthouseId | string | `<KALAHARI_GUESTHOUSE_ID>` |
| customerId | string | `testuser2` |
| score | number | `4` |
| createdAt | timestamp | Set to current time |
| updatedAt | timestamp | Set to current time |

### Rating 3
**Document ID:** `<KALAHARI_GUESTHOUSE_ID>_testuser3`

| Field | Type | Value |
|-------|------|-------|
| guesthouseId | string | `<KALAHARI_GUESTHOUSE_ID>` |
| customerId | string | `testuser3` |
| score | number | `5` |
| createdAt | timestamp | Set to current time |
| updatedAt | timestamp | Set to current time |

---

## Verification Checklist

After adding the data, verify:

- [ ] All 5 guesthouses appear in the `guesthouses` collection
- [ ] Each guesthouse has all required fields
- [ ] The `nameLower` and `cityLower` fields match the lowercase version of name/city
- [ ] At least 2 different cities are represented (Maun, Gaborone, Kasane, Francistown, Palapye)
- [ ] Price range varies (P420 to P1100)
- [ ] One guesthouse has ratings (Kalahari Sands Suite)
- [ ] Images load properly (check the Unsplash URLs)

---

## Method 2: Using the Seed Script

If you prefer automation, use the seed script:

```bash
cd lala-guesthouse-platform
npm install firebase dotenv
node scripts/seed-guesthouses.js
```

**Before running:**
1. Update the `adminUid` variable in the script with your actual admin UID
2. Ensure your `.env` file has the correct Firebase credentials

---

## Next Steps

Once the sample data is added:

1. **Test the web app dashboard** - verify it shows correct guesthouse count
2. **Test the mobile app browse screen** - verify guesthouses display correctly
3. **Test search and filters** - search by name, filter by city, sort by price/rating
4. **Move to Issue #37** - Test security rules against real app usage

---

## Troubleshooting

**Issue:** "Permission denied" error
- **Solution:** Make sure you're logged into Firebase Console with the correct account
- Check that Firestore security rules are published

**Issue:** Can't find admin UID
- **Solution:** Go to Authentication tab → Users → Copy the UID of your admin user

**Issue:** Images don't load
- **Solution:** The Unsplash URLs are public and should work. If not, replace with your own hosted images

---

## Coverage Summary

| City | Guesthouses | Price Range |
|------|-------------|-------------|
| Maun | 1 | P1,100 |
| Gaborone | 1 | P750 |
| Kasane | 1 | P950 |
| Francistown | 1 | P580 |
| Palapye | 1 | P420 |

**Total:** 5 guesthouses across 5 cities, covering price range P420-P1,100
