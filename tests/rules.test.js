// Firestore security rules tests. They run against the local Firestore emulator,
// never against the real project:  npm test
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080').split(':');
const ADMIN = 'admin-1';
const ALICE = 'alice';
const BOB = 'bob';
const HOUSE = 'house-1';

let env;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-lala',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host,
      port: Number(port),
    },
  });
});

afterAll(async () => {
  await env.cleanup();
});

// Fresh database before every test: one admin and one unrated guesthouse.
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'admins', ADMIN), {
      email: 'admin@test.com',
      displayName: 'Admin',
      createdAt: new Date(),
      createdBy: 'bootstrap',
    });
    await setDoc(doc(db, 'guesthouses', HOUSE), storedGuesthouse());
  });
});

// ---------- helpers ----------

function storedGuesthouse(overrides = {}) {
  return {
    name: 'Thamalakane River Lodge',
    nameLower: 'thamalakane river lodge',
    logoUrl: 'https://example.com/logo.png',
    galleryUrls: ['https://example.com/1.jpg'],
    description: 'A lodge on the river.',
    amenities: ['WiFi'],
    location: { lat: -19.98, lng: 23.41 },
    pricePerNight: 1100,
    city: 'Maun',
    cityLower: 'maun',
    country: 'Botswana',
    contact: { phone: '+267 686 0022', email: 'info@example.com' },
    averageRating: 0,
    ratingCount: 0,
    ratingSum: 0,
    createdAt: new Date(),
    createdBy: ADMIN,
    ...overrides,
  };
}

// What the admin portal sends when it registers a guesthouse.
function newGuesthouse(overrides = {}) {
  return storedGuesthouse({ createdAt: serverTimestamp(), ...overrides });
}

const admin = () => env.authenticatedContext(ADMIN, { email: 'admin@test.com' }).firestore();
const alice = () => env.authenticatedContext(ALICE, { email: 'alice@test.com' }).firestore();
const bob = () => env.authenticatedContext(BOB, { email: 'bob@test.com' }).firestore();
const anon = () => env.unauthenticatedContext().firestore();

// Mirrors the app's submitRating transaction (mobile/src/services/customerEngagement.ts).
// `tamper` lets a test change what the transaction writes to the guesthouse summary.
async function rate(db, uid, score, tamper = (summary) => summary, houseId = HOUSE) {
  const house = doc(db, 'guesthouses', houseId);
  const rating = doc(db, 'ratings', `${houseId}_${uid}`);
  return runTransaction(db, async (tx) => {
    const listing = await tx.get(house);
    const previous = await tx.get(rating);
    const { ratingCount, ratingSum } = listing.data();
    const oldScore = previous.exists() ? previous.data().score : 0;
    const newCount = ratingCount + (previous.exists() ? 0 : 1);
    const newSum = ratingSum - oldScore + score;
    tx.set(rating, {
      guesthouseId: houseId,
      customerId: uid,
      score,
      createdAt: previous.exists() ? previous.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    tx.update(
      house,
      tamper({ ratingCount: newCount, ratingSum: newSum, averageRating: newSum / newCount }),
    );
  });
}

// ---------- guesthouses ----------

describe('guesthouses', () => {
  it('can be read by anyone, even without an account', async () => {
    await assertSucceeds(getDoc(doc(anon(), 'guesthouses', HOUSE)));
  });

  it('can be registered by an admin with complete, valid data', async () => {
    await assertSucceeds(addDoc(collection(admin(), 'guesthouses'), newGuesthouse()));
  });

  it('cannot be registered by a customer or a visitor', async () => {
    await assertFails(addDoc(collection(alice(), 'guesthouses'), newGuesthouse({ createdBy: ALICE })));
    await assertFails(addDoc(collection(anon(), 'guesthouses'), newGuesthouse()));
  });

  it('must start with an empty rating summary', async () => {
    await assertFails(
      addDoc(collection(admin(), 'guesthouses'), newGuesthouse({ ratingCount: 50, ratingSum: 250, averageRating: 5 })),
    );
  });

  it('must include every required field', async () => {
    const incomplete = newGuesthouse();
    delete incomplete.pricePerNight;
    await assertFails(addDoc(collection(admin(), 'guesthouses'), incomplete));
  });

  it('rejects a negative price and out-of-range coordinates', async () => {
    await assertFails(addDoc(collection(admin(), 'guesthouses'), newGuesthouse({ pricePerNight: -5 })));
    await assertFails(addDoc(collection(admin(), 'guesthouses'), newGuesthouse({ location: { lat: 95, lng: 23 } })));
  });

  it('rejects search fields that do not match the name or city', async () => {
    await assertFails(addDoc(collection(admin(), 'guesthouses'), newGuesthouse({ nameLower: 'something else' })));
  });

  it('accepts an optional Setswana description within the length limit', async () => {
    await assertSucceeds(addDoc(collection(admin(), 'guesthouses'), newGuesthouse({ descriptionTn: 'Lodge e e monate.' })));
    await assertFails(addDoc(collection(admin(), 'guesthouses'), newGuesthouse({ descriptionTn: 'x'.repeat(2001) })));
    await assertFails(addDoc(collection(admin(), 'guesthouses'), newGuesthouse({ descriptionTn: 42 })));
  });

  it('records the creating admin, not someone else', async () => {
    await assertFails(addDoc(collection(admin(), 'guesthouses'), newGuesthouse({ createdBy: 'someone-else' })));
  });

  it('accepts published, draft and hidden status (and the older active and suspended) but nothing else', async () => {
    for (const status of ['published', 'draft', 'hidden', 'active', 'suspended'])
      await assertSucceeds(addDoc(collection(admin(), 'guesthouses'), newGuesthouse({ status })));
    await assertFails(addDoc(collection(admin(), 'guesthouses'), newGuesthouse({ status: 'archived' })));
    await assertFails(addDoc(collection(admin(), 'guesthouses'), newGuesthouse({ status: 7 })));
  });

  it('lets an admin hide and republish a listing, but not a customer', async () => {
    await assertSucceeds(updateDoc(doc(admin(), 'guesthouses', HOUSE), { status: 'hidden' }));
    await assertSucceeds(updateDoc(doc(admin(), 'guesthouses', HOUSE), { status: 'published' }));
    await assertFails(updateDoc(doc(admin(), 'guesthouses', HOUSE), { status: 'archived' }));
    await assertFails(updateDoc(doc(alice(), 'guesthouses', HOUSE), { status: 'hidden' }));
  });

  it('lets an admin record who changed a status and when', async () => {
    await assertSucceeds(
      updateDoc(doc(admin(), 'guesthouses', HOUSE), {
        status: 'hidden',
        statusChangedAt: serverTimestamp(),
        statusChangedBy: ADMIN,
      }),
    );
  });

  it('can be edited by an admin', async () => {
    await assertSucceeds(updateDoc(doc(admin(), 'guesthouses', HOUSE), { pricePerNight: 900 }));
  });

  it('cannot have its rating summary or creator changed by an admin', async () => {
    await assertFails(updateDoc(doc(admin(), 'guesthouses', HOUSE), { averageRating: 5 }));
    await assertFails(updateDoc(doc(admin(), 'guesthouses', HOUSE), { createdBy: 'someone-else' }));
  });

  it('cannot be edited by a customer', async () => {
    await assertFails(updateDoc(doc(alice(), 'guesthouses', HOUSE), { pricePerNight: 1 }));
  });

  it('can be deleted by an admin but not by a customer', async () => {
    await assertFails(deleteDoc(doc(alice(), 'guesthouses', HOUSE)));
    await assertSucceeds(deleteDoc(doc(admin(), 'guesthouses', HOUSE)));
  });
});

// ---------- rating integrity ----------

describe('ratings', () => {
  it('lets a customer rate through the normal transaction', async () => {
    await assertSucceeds(rate(alice(), ALICE, 4));
    await env.withSecurityRulesDisabled(async (context) => {
      const snap = await getDoc(doc(context.firestore(), 'guesthouses', HOUSE));
      const { ratingCount, ratingSum, averageRating } = snap.data();
      if (ratingCount !== 1 || ratingSum !== 4 || averageRating !== 4) {
        throw new Error(`Unexpected summary: ${ratingCount}, ${ratingSum}, ${averageRating}`);
      }
    });
  });

  it('lets two customers rate and averages them', async () => {
    await assertSucceeds(rate(alice(), ALICE, 5));
    await assertSucceeds(rate(bob(), BOB, 2));
  });

  it('lets a customer change their rating without raising the count', async () => {
    await assertSucceeds(rate(alice(), ALICE, 5));
    await assertSucceeds(rate(alice(), ALICE, 3));
  });

  it('blocks writing the rating summary directly', async () => {
    await assertFails(updateDoc(doc(alice(), 'guesthouses', HOUSE), { averageRating: 5, ratingCount: 999, ratingSum: 4995 }));
  });

  it('blocks a transaction that inflates the summary beyond the customer\'s own score', async () => {
    await assertFails(
      rate(alice(), ALICE, 1, (s) => ({ ratingCount: 1, ratingSum: 5, averageRating: 5 })),
    );
  });

  it('blocks a transaction that adds extra ratings to the count', async () => {
    await assertFails(
      rate(alice(), ALICE, 5, (s) => ({ ratingCount: 10, ratingSum: 5, averageRating: 0.5 })),
    );
  });

  it('blocks a summary whose average does not match the sum and count', async () => {
    await assertFails(rate(alice(), ALICE, 3, (s) => ({ ...s, averageRating: 5 })));
  });

  it('blocks a rating document written without updating the summary', async () => {
    await assertFails(
      setDoc(doc(alice(), 'ratings', `${HOUSE}_${ALICE}`), {
        guesthouseId: HOUSE,
        customerId: ALICE,
        score: 5,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('blocks rating as another customer', async () => {
    await assertFails(rate(alice(), BOB, 5));
  });

  it('blocks scores outside 1-5 and non-whole scores', async () => {
    await assertFails(rate(alice(), ALICE, 6));
    await assertFails(rate(alice(), ALICE, 0));
    await assertFails(rate(alice(), ALICE, 3.5));
  });

  it('blocks rating a draft or hidden guesthouse', async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'guesthouses', 'draft-house'), storedGuesthouse({ status: 'draft' }));
      await setDoc(doc(context.firestore(), 'guesthouses', 'hidden-house'), storedGuesthouse({ status: 'hidden' }));
    });
    await assertFails(rate(alice(), ALICE, 5, (s) => s, 'draft-house'));
    await assertFails(rate(alice(), ALICE, 5, (s) => s, 'hidden-house'));
  });

  it('still allows rating a listing created before status existed', async () => {
    await assertSucceeds(rate(alice(), ALICE, 5));
  });

  it('blocks rating a guesthouse that does not exist', async () => {
    await assertFails(
      setDoc(doc(alice(), 'ratings', `missing_${ALICE}`), {
        guesthouseId: 'missing',
        customerId: ALICE,
        score: 5,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('blocks visitors without an account', async () => {
    await assertFails(rate(anon(), 'nobody', 5));
  });

  it('are readable by anyone but never deletable', async () => {
    await rate(alice(), ALICE, 4);
    await assertSucceeds(getDoc(doc(anon(), 'ratings', `${HOUSE}_${ALICE}`)));
    await assertFails(deleteDoc(doc(alice(), 'ratings', `${HOUSE}_${ALICE}`)));
  });
});

// ---------- admins ----------

describe('admins', () => {
  const newAdmin = (overrides = {}) => ({
    email: 'second@test.com',
    displayName: 'Second Admin',
    createdAt: serverTimestamp(),
    createdBy: ADMIN,
    ...overrides,
  });

  it('can be created by an existing admin', async () => {
    await assertSucceeds(setDoc(doc(admin(), 'admins', 'admin-2'), newAdmin()));
  });

  it('cannot be created by a customer, so nobody can promote themselves', async () => {
    await assertFails(setDoc(doc(alice(), 'admins', ALICE), newAdmin({ createdBy: ALICE })));
  });

  it('cannot be created by a visitor', async () => {
    await assertFails(setDoc(doc(anon(), 'admins', 'x'), newAdmin()));
  });

  it('cannot replace an existing admin profile, which is what happens if the portal re-adds one', async () => {
    await assertFails(setDoc(doc(admin(), 'admins', ADMIN), newAdmin({ email: 'changed@test.com' })));
  });

  it('cannot be created with someone else recorded as the creator', async () => {
    await assertFails(setDoc(doc(admin(), 'admins', 'admin-2'), newAdmin({ createdBy: 'someone-else' })));
  });

  it('can be read by admins and by themselves, but not by other customers', async () => {
    await assertSucceeds(getDoc(doc(admin(), 'admins', ADMIN)));
    await assertFails(getDoc(doc(alice(), 'admins', ADMIN)));
  });

  it('can never be deleted from the client', async () => {
    await assertFails(deleteDoc(doc(admin(), 'admins', ADMIN)));
  });
});

// ---------- customers and favourites ----------

describe('customers', () => {
  const profile = (overrides = {}) => ({
    email: 'alice@test.com',
    displayName: 'Alice',
    createdAt: serverTimestamp(),
    ...overrides,
  });

  it('can create their own profile', async () => {
    await assertSucceeds(setDoc(doc(alice(), 'customers', ALICE), profile()));
  });

  it('cannot create a profile for someone else', async () => {
    await assertFails(setDoc(doc(alice(), 'customers', BOB), profile()));
  });

  it('cannot store an email that is not their own', async () => {
    await assertFails(setDoc(doc(alice(), 'customers', ALICE), profile({ email: 'other@test.com' })));
  });

  it('cannot add extra fields to their profile', async () => {
    await assertFails(setDoc(doc(alice(), 'customers', ALICE), profile({ isAdmin: true })));
  });

  it('cannot be read by another customer', async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'customers', ALICE), { email: 'alice@test.com', displayName: 'Alice', createdAt: new Date() });
    });
    await assertSucceeds(getDoc(doc(alice(), 'customers', ALICE)));
    await assertFails(getDoc(doc(bob(), 'customers', ALICE)));
  });
});

describe('favourites', () => {
  const favourite = (id = HOUSE) => ({ guesthouseId: id, addedAt: serverTimestamp() });

  it('can be saved and removed by the owner', async () => {
    await assertSucceeds(setDoc(doc(alice(), 'customers', ALICE, 'favourites', HOUSE), favourite()));
    await assertSucceeds(deleteDoc(doc(alice(), 'customers', ALICE, 'favourites', HOUSE)));
  });

  it('cannot be written into another customer\'s list', async () => {
    await assertFails(setDoc(doc(alice(), 'customers', BOB, 'favourites', HOUSE), favourite()));
  });

  it('cannot point at a guesthouse that does not exist', async () => {
    await assertFails(setDoc(doc(alice(), 'customers', ALICE, 'favourites', 'missing'), favourite('missing')));
  });

  it('cannot be read by another customer', async () => {
    await assertFails(getDoc(doc(bob(), 'customers', ALICE, 'favourites', HOUSE)));
  });
});
