import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';
import { initializeApp, deleteApp } from 'firebase/app';
import * as firestoreApi from 'firebase/firestore';
const app = initializeApp(
  { apiKey: 'demo-key', projectId: 'demo-lala-auth', appId: 'demo-app' },
  'detail-test',
);
const db = firestoreApi.getFirestore(app);
firestoreApi.connectFirestoreEmulator(db, '127.0.0.1', 8080);
const deps = {
  'firebase/firestore': firestoreApi,
  '../config/firebase': { firestore: db },
};
async function load(name) {
  const source = await readFile(
    new URL(`../src/services/${name}.ts`, import.meta.url),
    'utf8',
  );
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    { exports, require: (name) => deps[name] },
  );
  return exports;
}
deps['./guesthouses'] = await load('guesthouses');
const { mapGuesthouseDetails, subscribeToGuesthouseDetails } =
  await load('guesthouseDetails');
const fixture = {
  name: 'River Test House',
  city: 'Maun',
  country: 'Botswana',
  pricePerNight: 520,
  description: 'A riverside stay.',
  amenities: ['WiFi', 'Pool'],
  galleryUrls: [
    'https://example.com/a.jpg',
    'bad',
    'https://example.com/a.jpg',
    'https://example.com/b.jpg',
  ],
  logoUrl: 'https://example.com/logo.jpg',
  location: { lat: -19.98, lng: 23.42 },
  contact: {
    phone: '+267 1234567',
    email: 'host@example.com',
    address: 'Plot 1482',
    invalid: null,
  },
  numberOfRooms: 6,
  checkInTime: '14:00',
  checkOutTime: '10:00',
  houseRules: 'Quiet hours after 22:00',
  averageRating: 4.8,
  ratingCount: 34,
};
const mapped = mapGuesthouseDetails('test', fixture);
assert.equal(mapped.galleryUrls.length, 2);
assert.equal(mapped.contact.address, 'Plot 1482');
assert.equal(mapped.contact.invalid, undefined);
assert.equal(mapped.location.lat, -19.98);
assert.equal(mapped.numberOfRooms, 6);
assert.equal(mapped.houseRules, fixture.houseRules);
assert.equal(
  mapGuesthouseDetails('suspended', { ...fixture, status: 'suspended' }),
  null,
);
assert.equal(
  mapGuesthouseDetails('bad', { name: 'bad', pricePerNight: -1 }),
  null,
);
const missing = mapGuesthouseDetails('missing', {
  name: 'Minimal',
  pricePerNight: 0,
  location: { lat: 91, lng: 0 },
});
assert.equal(missing.location, null);
assert.equal(missing.galleryUrls.length, 0);
assert.equal(missing.checkInTime, '');
assert.equal(
  mapGuesthouseDetails('zero', { ...fixture, location: { lat: 0, lng: 0 } })
    .location.lat,
  0,
);
const id = `details-test-${Date.now()}`;
const url = `http://127.0.0.1:8080/v1/projects/demo-lala-auth/databases/(default)/documents/guesthouses/${id}`;
function value(v) {
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'number') return { doubleValue: v };
  if (v === null) return { nullValue: null };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(value) } };
  return {
    mapValue: {
      fields: Object.fromEntries(
        Object.entries(v).map(([k, v]) => [k, value(v)]),
      ),
    },
  };
}
async function write(data) {
  const response = await fetch(url, {
    method: data ? 'PATCH' : 'DELETE',
    headers: {
      Authorization: 'Bearer owner',
      'Content-Type': 'application/json',
    },
    ...(data
      ? { body: JSON.stringify({ fields: value(data).mapValue.fields }) }
      : {}),
  });
  assert.ok(response.ok, await response.text());
}
let unsubscribe;
try {
  await write(fixture);
  let latest;
  let failure;
  unsubscribe = subscribeToGuesthouseDetails(
    id,
    (v) => {
      latest = v;
    },
    (e) => {
      failure = e;
    },
  );
  async function waitFor(predicate) {
    const end = Date.now() + 10000;
    while (!predicate()) {
      if (failure) throw failure;
      if (Date.now() > end) throw Error('Listener timed out');
      await new Promise((r) => setTimeout(r, 50));
    }
  }
  await waitFor(() => latest?.name === fixture.name);
  assert.equal(latest.galleryUrls.length, 2);
  await write({ ...fixture, name: 'Updated House', pricePerNight: 650 });
  await waitFor(() => latest?.name === 'Updated House');
  assert.equal(latest.pricePerNight, 650);
  await write({ ...fixture, status: 'suspended' });
  await waitFor(() => latest === null);
  await write({ ...fixture, status: 'active' });
  await waitFor(() => latest?.name === fixture.name);
  await write(null);
  await waitFor(() => latest === null);
  let invalid = 'unset';
  subscribeToGuesthouseDetails(
    'invalid/id',
    (v) => {
      invalid = v;
    },
    (e) => {
      throw e;
    },
  );
  assert.equal(invalid, null);
  console.log(
    'Detail mapping, public loading, live updates, deletion, invalid IDs and missing-field checks passed.',
  );
} finally {
  unsubscribe?.();
  await write(null);
  await firestoreApi.terminate(db);
  await deleteApp(app);
}
