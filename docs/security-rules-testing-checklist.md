# Security Rules Manual Testing Checklist

**Issue:** #37 - Test security rules against real app usage  
**Owner:** Team Beta (Database & Backend)  
**Date:** 2026-10-09  
**Status:** Ready for Testing

## Prerequisites

Before starting, ensure:
- [ ] Sample guesthouse data is added to Firestore (Issue #39 completed)
- [ ] First admin user is created in Firebase Console
- [ ] At least 2 test customer accounts created in Firebase Authentication
- [ ] Web and/or mobile app can connect to Firebase
- [ ] `.env` files are configured with correct Firebase credentials

---

## Test Users Setup

Create these test users in Firebase Console → Authentication:

| Type | Email | Password | Purpose |
|------|-------|----------|---------|
| Admin | admin@test.com | (strong password) | Test admin operations |
| Customer 1 | customer1@test.com | (strong password) | Primary customer tests |
| Customer 2 | customer2@test.com | (strong password) | Cross-customer access tests |

**For the admin:** Also create their admin document in Firestore at `admins/{uid}` with fields:
- `email`: admin@test.com
- `displayName`: Test Admin
- `createdAt`: (current timestamp)
- `createdBy`: bootstrap

---

## Test Scenario 1: Logged-Out Browsing ✅

**Goal:** Verify that anyone can browse guesthouses and ratings without logging in.

### Steps:
1. Open the web or mobile app **without logging in**
2. Navigate to the guesthouse listing/browse page
3. Try to view guesthouse details

### Expected Results:
- ✅ Can see list of guesthouses
- ✅ Can open and view guesthouse details
- ✅ Can see ratings and average rating
- ✅ No login prompt required

### One-Line Test Result:
```
[ ] PASS - Logged-out browsing works, guesthouses visible without authentication
[ ] FAIL - (describe issue)
```

---

## Test Scenario 2: Customer Cannot Edit Guesthouse Fields ❌

**Goal:** Verify that customers cannot edit guesthouse core fields (only rating summary via transaction).

### Steps:
1. Log in as **customer1@test.com**
2. Try to directly edit a guesthouse field using browser console or app:
   ```javascript
   // In browser console:
   import { doc, updateDoc } from 'firebase/firestore';
   import { firestore } from './config/firebase';
   
   await updateDoc(doc(firestore, 'guesthouses', 'GUESTHOUSE_ID'), {
     name: 'Hacked Name'
   });
   ```

### Expected Results:
- ✅ Operation should **fail** with permission denied error
- ✅ Guesthouse name should remain unchanged
- ✅ Customer can only update rating summary fields via transaction (tested separately)

### One-Line Test Result:
```
[ ] PASS - Customer cannot edit guesthouse core fields, permission denied as expected
[ ] FAIL - (describe issue)
```

---

## Test Scenario 3: Admin Can Create/Edit/Delete Guesthouses ✅

**Goal:** Verify that admins have full control over guesthouse data.

### Steps:
1. Log in as **admin@test.com** to the web app
2. Navigate to the guesthouse registration/listing page
3. **Create** a new guesthouse with all required fields
4. **Edit** the newly created guesthouse (change price or amenities)
5. **Delete** the test guesthouse

### Expected Results:
- ✅ Can successfully create new guesthouse
- ✅ New guesthouse appears in the listing
- ✅ Can edit existing guesthouse fields
- ✅ Changes are saved and reflected immediately
- ✅ Can delete guesthouses
- ✅ Deleted guesthouse is removed from listing

### One-Line Test Result:
```
[ ] PASS - Admin can create, edit, and delete guesthouses without restrictions
[ ] FAIL - (describe issue)
```

---

## Test Scenario 4: Customer Can Only Touch Own Favourites/Profile ✅

**Goal:** Verify that customers can only access their own data, not other customers' data.

### Part A: Own Favourites
1. Log in as **customer1@test.com**
2. Add a guesthouse to favourites
3. View your favourites list
4. Remove the guesthouse from favourites

### Expected Results:
- ✅ Can add guesthouse to own favourites
- ✅ Can see own favourites list
- ✅ Can remove from own favourites

### Part B: Cross-Customer Access Prevention
1. Keep customer1 logged in with a favourite saved
2. Log out and log in as **customer2@test.com**
3. Try to access customer1's favourites (via console or direct query)
   ```javascript
   // In browser console:
   import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
   import { firestore } from './config/firebase';
   
   // Try to read customer1's favourites
   const customer1Uid = 'CUSTOMER_1_UID';
   await getDocs(collection(firestore, 'customers', customer1Uid, 'favourites'));
   ```

### Expected Results:
- ✅ Customer2 **cannot** read customer1's favourites
- ✅ Operation fails with permission denied error
- ✅ Customer2 **cannot** delete customer1's favourites
- ✅ Each customer sees only their own favourites

### One-Line Test Result:
```
[ ] PASS - Customer can only access own favourites/profile, cross-customer access blocked
[ ] FAIL - (describe issue)
```

---

## Test Scenario 5: Rating Submission with Transaction ✅

**Goal:** Verify that rating submission updates guesthouse averageRating correctly using transaction.

### Steps:
1. Log in as **customer1@test.com**
2. Find a guesthouse with **0 ratings** (averageRating: 0, ratingCount: 0)
3. Submit a rating of **5 stars**
4. Check that guesthouse now shows:
   - `averageRating`: 5
   - `ratingCount`: 1
   - `ratingSum`: 5
5. Log in as **customer2@test.com**
6. Submit a rating of **3 stars** on the same guesthouse
7. Check that guesthouse now shows:
   - `averageRating`: 4 (calculated: 8/2)
   - `ratingCount`: 2
   - `ratingSum`: 8

### Expected Results:
- ✅ First rating updates guesthouse correctly
- ✅ Second rating recalculates average correctly
- ✅ Both ratings are stored in `ratings` collection
- ✅ Rating IDs follow format: `{guesthouseId}_{customerUid}`

### One-Line Test Result:
```
[ ] PASS - Rating submission correctly updates guesthouse average using transaction
[ ] FAIL - (describe issue)
```

---

## Test Scenario 6: Rating Validation ✅

**Goal:** Verify that only valid ratings (1-5, integer) are accepted.

### Steps:
1. Log in as **customer1@test.com**
2. Try to submit various invalid ratings via the service function:

**Test 6a: Valid rating (5)**
```javascript
await submitRating(currentUser.uid, guesthouseId, 5);
```
Expected: ✅ Accepted

**Test 6b: Invalid rating (0)**
```javascript
await submitRating(currentUser.uid, guesthouseId, 0);
```
Expected: ❌ Rejected with error

**Test 6c: Invalid rating (6)**
```javascript
await submitRating(currentUser.uid, guesthouseId, 6);
```
Expected: ❌ Rejected with error

**Test 6d: Non-integer rating (3.5)**
```javascript
await submitRating(currentUser.uid, guesthouseId, 3.5);
```
Expected: ❌ Rejected with error

### Expected Results:
- ✅ Ratings 1-5 are accepted
- ✅ Rating 0 is rejected
- ✅ Rating 6+ is rejected
- ✅ Decimal ratings are rejected
- ✅ Error messages are clear

### One-Line Test Result:
```
[ ] PASS - Rating validation works, only integers 1-5 accepted
[ ] FAIL - (describe issue)
```

---

## Test Scenario 7: One Rating Per Customer Per Guesthouse ✅

**Goal:** Verify that a customer can only have one rating per guesthouse (updating replaces the old one).

### Steps:
1. Log in as **customer1@test.com**
2. Submit a rating of **5 stars** for a guesthouse
3. Check the rating is stored with ID: `{guesthouseId}_{customer1Uid}`
4. Submit another rating of **4 stars** for the **same guesthouse**
5. Check that:
   - Only **one** rating document exists for this customer+guesthouse
   - The rating score is now **4** (updated from 5)
   - The guesthouse's average reflects the change

### Expected Results:
- ✅ First rating creates the document
- ✅ Second rating updates (not creates) the same document
- ✅ Old rating is overwritten
- ✅ Guesthouse average is recalculated correctly

### One-Line Test Result:
```
[ ] PASS - One rating per customer per guesthouse enforced, updates replace old ratings
[ ] FAIL - (describe issue)
```

---

## Test Scenario 8: Results Documentation ✅

**Goal:** Document all test results for the GitHub issue.

### Final Checklist:
- [ ] All 7 test scenarios completed
- [ ] Each scenario has a one-line result note
- [ ] Any failures are documented with details
- [ ] Screenshots or console logs saved (if needed)
- [ ] Results posted to GitHub Issue #37

### Results Template for GitHub Issue:

```markdown
## Security Rules Test Results

**Tested by:** [Your Name]  
**Date:** 2026-10-09  
**Environment:** [Web/Mobile/Both]

### ✅ Scenario 1: Logged-out browsing
- Result: PASS
- Note: Guesthouses and ratings visible without authentication

### ✅ Scenario 2: Customer cannot edit guesthouses
- Result: PASS
- Note: Permission denied when customer tries to edit guesthouse fields

### ✅ Scenario 3: Admin can create/edit/delete guesthouses
- Result: PASS
- Note: All CRUD operations work as expected for admin

### ✅ Scenario 4: Customer can only touch own favourites/profile
- Result: PASS
- Note: Cross-customer access correctly blocked

### ✅ Scenario 5: Rating submission with transaction
- Result: PASS
- Note: Average rating updates correctly with multiple ratings

### ✅ Scenario 6: Rating validation
- Result: PASS
- Note: Only integers 1-5 accepted, other values rejected

### ✅ Scenario 7: One rating per customer per guesthouse
- Result: PASS
- Note: Updates replace old ratings as expected

---

**Summary:** All security rules working as designed. Ready for Alpha and Charlie teams to integrate.
```

---

## Troubleshooting

### Issue: "Permission denied" when testing admin operations
**Solution:** 
- Verify admin document exists in `admins/{uid}` collection
- Check that `uid` matches the authenticated user's UID
- Confirm security rules are published in Firebase Console

### Issue: Transaction fails when submitting rating
**Solution:**
- Check that `submitRating()` function is being used (not raw Firestore calls)
- Verify guesthouse document exists
- Check browser console for detailed error messages

### Issue: Can't test cross-customer access
**Solution:**
- Make sure you're testing from the actual app, not Firebase Console
- Firebase Console bypasses security rules
- Use browser dev tools to run Firestore operations

---

## Automated Testing (Optional)

For automated testing, run:

```bash
cd lala-guesthouse-platform
npm install @firebase/rules-unit-testing
node tests/security-rules.test.js
```

This will run all scenarios automatically and output results.

---

## Next Steps After Testing

Once all tests pass:
1. ✅ Mark Issue #37 as complete on GitHub
2. ✅ Notify Team Alpha (web) that security is verified
3. ✅ Notify Team Charlie (mobile) that security is verified
4. ✅ Both teams can proceed with confidence integrating the Firestore services
5. ✅ Move on to implementing Firebase Storage for image uploads

---

## Notes

- Testing should be done from the actual web/mobile app, not Firebase Console (Console bypasses rules)
- Document any unexpected behavior or edge cases discovered
- If rules need updating, modify `firestore.rules` and republish
