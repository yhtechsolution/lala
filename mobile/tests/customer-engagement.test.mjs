import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  initializeAuth,
  inMemoryPersistence,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  getDoc,
  setDoc,
  terminate,
} from 'firebase/firestore';
const project = 'demo-lala-auth';
const base = `http://127.0.0.1:8080/v1/projects/${project}/databases/(default)/documents`;
const prefix = `engagement-${Date.now()}`;
const listingId = `${prefix}-lodge`;
const concurrentId = `${prefix}-concurrent`;
const invalidId = `${prefix}-invalid`;
const source = await readFile(
  new URL('../src/services/customerEngagement.ts', import.meta.url),
  'utf8',
);
const clients = [];
async function client(label) {
  const app = initializeApp(
    { apiKey: 'demo-key', projectId: project, appId: 'demo-app' },
    `${prefix}-${label}`,
  );
  const auth = initializeAuth(app, { persistence: inMemoryPersistence });
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const firestore = getFirestore(app);
  connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
  globalThis[label] = { auth, firestore };
  const fixture =
    'data:text/javascript,' +
    encodeURIComponent(
      `export const { auth, firestore } = globalThis[${JSON.stringify(label)}];`,
    );
  const compiled = ts
    .transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    })
    .outputText.replaceAll(
      "'firebase/firestore'",
      JSON.stringify(import.meta.resolve('firebase/firestore')),
    )
    .replaceAll("'../config/firebase'", JSON.stringify(fixture));
  const service = await import(
    'data:text/javascript,' + encodeURIComponent(compiled)
  );
  const value = { app, auth, firestore, service };
  clients.push(value);
  return value;
}
async function request(path, method, body) {
  const response = await fetch(`${base}/${path}`, {
    method,
    headers: {
      Authorization: 'Bearer owner',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  assert.ok(response.ok, await response.text());
}
async function seed(id, summary = {}) {
  await request(`guesthouses/${id}`, 'PATCH', {
    fields: {
      name: { stringValue: 'Test Lodge' },
      pricePerNight: { doubleValue: 450 },
      ratingCount: { integerValue: '0' },
      ratingSum: { integerValue: '0' },
      averageRating: { doubleValue: 0 },
      ...summary,
    },
  });
}
const a = await client('engagementA');
const b = await client('engagementB');
const reload = await client('engagementReload');
let stop;
let latest = [];
const waitFor = async (predicate) => {
  const end = Date.now() + 15000;
  while (!predicate()) {
    if (Date.now() > end) throw new Error('Listener timed out');
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
};
try {
  await seed(listingId);
  await seed(concurrentId);
  await seed(invalidId, { ratingCount: { integerValue: '2' } });
  await assert.rejects(
    a.service.setGuesthouseFavourite(listingId, true),
    /sign in/,
  );
  await assert.rejects(a.service.submitRating(listingId, 5), /sign in/);
  await assert.rejects(
    setDoc(doc(a.firestore, 'customers', 'no-user', 'favourites', listingId), {
      guesthouseId: listingId,
    }),
    (error) => error.code === 'permission-denied',
  );
  console.log(
    'PASS: Logged-out service calls and direct favourite writes are blocked',
  );
  const email = `${prefix}-a@example.test`;
  const password = 'Test-only-password-123';
  const { user: userA } = await createUserWithEmailAndPassword(
    a.auth,
    email,
    password,
  );
  const { user: userB } = await createUserWithEmailAndPassword(
    b.auth,
    `${prefix}-b@example.test`,
    password,
  );
  stop = a.service.subscribeToFavouriteIds(
    userA.uid,
    (ids) => {
      latest = ids;
    },
    (error) => {
      throw error;
    },
  );
  await a.service.setGuesthouseFavourite(listingId, true);
  await waitFor(() => latest.includes(listingId));
  const first = await getDoc(
    doc(a.firestore, 'customers', userA.uid, 'favourites', listingId),
  );
  await a.service.setGuesthouseFavourite(listingId, true);
  assert.equal(
    (await getDoc(first.ref)).data().addedAt.toMillis(),
    first.data().addedAt.toMillis(),
  );
  await signInWithEmailAndPassword(reload.auth, email, password);
  assert.equal(
    (
      await getDoc(
        doc(reload.firestore, 'customers', userA.uid, 'favourites', listingId),
      )
    ).exists(),
    true,
  );
  await assert.rejects(
    getDoc(doc(b.firestore, 'customers', userA.uid, 'favourites', listingId)),
    (error) => error.code === 'permission-denied',
  );
  await assert.rejects(
    setDoc(doc(b.firestore, 'customers', userA.uid, 'favourites', listingId), {
      guesthouseId: listingId,
    }),
    (error) => error.code === 'permission-denied',
  );
  console.log(
    'PASS: Favourite timestamp/idempotency, independent-client persistence, and owner isolation',
  );
  await a.service.setGuesthouseFavourite(listingId, false);
  await waitFor(() => !latest.includes(listingId));
  assert.equal(
    (
      await getDoc(
        doc(reload.firestore, 'customers', userA.uid, 'favourites', listingId),
      )
    ).exists(),
    false,
  );
  await assert.rejects(
    a.service.setGuesthouseFavourite(`${prefix}-missing`, true),
    /no longer available/,
  );
  console.log(
    'PASS: Unfavourite persists and nonexistent listings cannot be saved',
  );
  for (const score of [0, 6, 3.5, NaN])
    await assert.rejects(
      a.service.submitRating(listingId, score),
      /whole-number/,
    );
  let summary = await a.service.submitRating(listingId, 5);
  assert.deepEqual(summary, { ratingCount: 1, ratingSum: 5, averageRating: 5 });
  const ratingRef = doc(a.firestore, 'ratings', `${listingId}_${userA.uid}`);
  const createdAt = (await getDoc(ratingRef)).data().createdAt.toMillis();
  summary = await a.service.submitRating(listingId, 3);
  assert.deepEqual(summary, { ratingCount: 1, ratingSum: 3, averageRating: 3 });
  assert.equal(
    (await getDoc(ratingRef)).data().createdAt.toMillis(),
    createdAt,
  );
  assert.equal(await a.service.getCustomerRating(listingId), 3);
  summary = await b.service.submitRating(listingId, 1);
  assert.deepEqual(summary, { ratingCount: 2, ratingSum: 4, averageRating: 2 });
  await Promise.all([
    a.service.submitRating(listingId, 5),
    b.service.submitRating(listingId, 3),
  ]);
  let data = (await getDoc(doc(a.firestore, 'guesthouses', listingId))).data();
  assert.equal(data.ratingSum, 8);
  assert.equal(data.ratingCount, 2);
  assert.equal(data.averageRating, 4);
  await Promise.all([
    a.service.submitRating(concurrentId, 1),
    b.service.submitRating(concurrentId, 5),
  ]);
  data = (await getDoc(doc(a.firestore, 'guesthouses', concurrentId))).data();
  assert.equal(data.ratingSum, 6);
  assert.equal(data.ratingCount, 2);
  assert.equal(data.averageRating, 3);
  console.log(
    'PASS: First/change ratings, original timestamp, and concurrent transactions maintain correct aggregates',
  );
  await assert.rejects(
    a.service.submitRating(invalidId, 4),
    /summary needs attention/,
  );
  assert.equal(
    (
      await getDoc(doc(a.firestore, 'ratings', `${invalidId}_${userA.uid}`))
    ).exists(),
    false,
  );
  await assert.rejects(
    a.service.submitRating(`${prefix}-missing`, 4),
    /no longer available/,
  );
  await assert.rejects(
    setDoc(doc(b.firestore, 'ratings', `${listingId}_${userA.uid}`), {
      guesthouseId: listingId,
      customerId: userA.uid,
      score: 5,
    }),
    (error) => error.code === 'permission-denied',
  );
  console.log(
    'PASS: Malformed/deleted listings reject ratings atomically; other customers cannot overwrite a rating',
  );
  await a.service.setGuesthouseFavourite(listingId, true);
  await request(`guesthouses/${listingId}`, 'DELETE');
  await a.service.setGuesthouseFavourite(listingId, false);
  assert.equal((await getDoc(first.ref)).exists(), false);
  await signOut(a.auth);
  await assert.rejects(a.service.submitRating(concurrentId, 4), /sign in/);
  console.log(
    'PASS: Deleted favourites can be removed and sign-out blocks further mutations',
  );
} finally {
  stop?.();
  for (const id of [listingId, concurrentId, invalidId])
    await request(`guesthouses/${id}`, 'DELETE');
  for (const value of clients) {
    await terminate(value.firestore);
    await deleteApp(value.app);
  }
}
