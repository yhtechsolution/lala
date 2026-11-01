# Security Rules Quick Reference

**Fast lookup for expected behavior per user type**

---

## 🔓 Public (Not Logged In)

| Action | Allowed? | Collection |
|--------|----------|------------|
| Read guesthouses | ✅ YES | `guesthouses` |
| Read guesthouse details | ✅ YES | `guesthouses/{id}` |
| Read ratings | ✅ YES | `ratings` |
| Write anything | ❌ NO | All collections |

---

## 👤 Customer (Logged In)

| Action | Allowed? | Collection | Notes |
|--------|----------|------------|-------|
| Read guesthouses | ✅ YES | `guesthouses` | Public read |
| Read ratings | ✅ YES | `ratings` | Public read |
| **Write guesthouse** | ❌ NO | `guesthouses` | Admin only |
| Read own profile | ✅ YES | `customers/{own_uid}` | Only own |
| Write own profile | ✅ YES | `customers/{own_uid}` | Only own |
| Read other's profile | ❌ NO | `customers/{other_uid}` | Blocked |
| Add own favourite | ✅ YES | `customers/{own_uid}/favourites` | Only own |
| Remove own favourite | ✅ YES | `customers/{own_uid}/favourites` | Only own |
| Read other's favourites | ❌ NO | `customers/{other_uid}/favourites` | Blocked |
| Submit rating (1-5) | ✅ YES | `ratings/{id}` | Integer only, one per guesthouse |
| Submit rating (0 or 6+) | ❌ NO | `ratings` | Validation blocks |
| Update guesthouse rating summary | ✅ YES* | `guesthouses/{id}` | *Via transaction only |

---

## 👨‍💼 Admin (Logged In)

| Action | Allowed? | Collection | Notes |
|--------|----------|------------|-------|
| Everything customers can do | ✅ YES | All | Plus admin powers |
| Create guesthouse | ✅ YES | `guesthouses` | Full access |
| Edit guesthouse | ✅ YES | `guesthouses/{id}` | Full access |
| Delete guesthouse | ✅ YES | `guesthouses/{id}` | Full access |
| Create admin | ✅ YES | `admins` | Can invite others |
| Read admin list | ✅ YES | `admins` | See all admins |
| Delete admin | ❌ NO | `admins` | Not from client |

---

## 🔒 Key Security Rules

### Rule 1: Public Read for Discovery
```
Guesthouses and ratings are publicly readable so anyone can browse without signing up.
```

### Rule 2: Admin-Only Write for Guesthouses
```
Only users with a document in admins/{uid} can create/edit/delete guesthouses.
```

### Rule 3: Customer-Only Access to Own Data
```
Customers can only read/write their own profile and favourites subcollection.
Path: customers/{uid} where uid MUST match request.auth.uid
```

### Rule 4: Rating Validation
```
- Score must be integer 1-5
- Document ID must be: {guesthouseId}_{customerUid}
- customerId field must equal request.auth.uid
- This enforces one rating per customer per guesthouse
```

### Rule 5: Transaction for Rating Summary
```
Customer rating updates can ONLY touch these fields on guesthouse:
- ratingSum
- ratingCount  
- averageRating

All other fields blocked. Use transaction to keep them in sync.
```

---

## 🧪 Quick Test Commands

### Test as logged-out user:
```javascript
// Should work:
const guesthouses = await getGuesthouses();
```

### Test as customer:
```javascript
// Should work:
await addFavourite(currentUser.uid, guesthouseId);
await submitRating(currentUser.uid, guesthouseId, 5);

// Should fail:
await updateGuesthouse(guesthouseId, { name: "Hacked" }); // ❌ permission-denied
```

### Test as admin:
```javascript
// Should work:
await addGuesthouse(guesthouseData, adminUid);
await updateGuesthouse(id, { pricePerNight: 999 });
await deleteGuesthouse(id);
```

---

## 📋 Testing Checklist

Quick status check:

```
[ ] Logged-out browsing works
[ ] Customer cannot edit guesthouse core fields
[ ] Admin can create/edit/delete guesthouses  
[ ] Customer can only touch their own favourites/profile
[ ] Customer cannot access other customers' data
[ ] Rating validation (1-5 only)
[ ] Rating transaction updates averageRating correctly
[ ] One rating per customer per guesthouse
```

---

## 🚨 Common Mistakes to Avoid

1. **Testing from Firebase Console** - Console bypasses security rules!
   - ✅ Test from actual app (web/mobile)
   - ✅ Test with real authenticated users

2. **Forgetting the admin document** - Admin powers come from Firestore, not Auth!
   - ✅ Create `admins/{uid}` document for each admin
   - ❌ Auth role claims are not used in this project

3. **Direct Firestore calls for ratings** - Must use transaction!
   - ✅ Use `submitRating()` function
   - ❌ Don't call `updateDoc()` directly on guesthouse

4. **Testing with same user** - Cross-customer tests need 2 users!
   - ✅ Create 2+ test customer accounts
   - ✅ Test Customer A cannot access Customer B's data

---

## 📞 Who to Contact

| Issue | Contact |
|-------|---------|
| Security rules behavior | Team Beta (Database & Backend) |
| Web app integration | Team Alpha |
| Mobile app integration | Team Charlie |
| Firebase Console access | Project admin |

---

**Version:** 1.0  
**Last Updated:** 2026-10-09
