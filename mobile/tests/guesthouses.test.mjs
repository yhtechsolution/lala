// Real Firestore query/listener tests against the isolated demo project.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  getFirestore,
  connectFirestoreEmulator,
  terminate,
} from 'firebase/firestore';

const project = 'demo-lala-auth';
const base = `http://127.0.0.1:8080/v1/projects/${project}/databases/(default)/documents/guesthouses`;
const prefix = `browse-test-${Date.now()}`;
const ids = ['expensive', 'cheap', 'middle', 'bad', 'incomplete'].map(
  (name) => `${prefix}-${name}`,
);
const app = initializeApp(
  { apiKey: 'demo-key', projectId: project, appId: 'demo-app' },
  prefix,
);
const firestore = getFirestore(app);
connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
globalThis.__lalaBrowseTest = { firestore };
const config =
  'data:text/javascript,' +
  encodeURIComponent(
    'export const { firestore } = globalThis.__lalaBrowseTest;',
  );
const source = await readFile(
  new URL('../src/services/guesthouses.ts', import.meta.url),
  'utf8',
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
  .replaceAll("'../config/firebase'", JSON.stringify(config));
const service = await import(
  'data:text/javascript,' + encodeURIComponent(compiled)
);

async function request(url, method, body) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: 'Bearer owner',
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  assert.ok(
    response.ok,
    `${method} emulator request failed: ${await response.text()}`,
  );
}
function fields(name, price, extra = {}) {
  return {
    name: { stringValue: name },
    nameLower: { stringValue: name.toLowerCase() },
    cityLower: { stringValue: 'maun' },
    pricePerNight: { doubleValue: price },
    city: { stringValue: 'Maun' },
    country: { stringValue: 'Botswana' },
    averageRating: { doubleValue: 4.5 },
    ratingCount: { integerValue: '12' },
    description: { stringValue: 'A real Firestore test record' },
    location: {
      mapValue: {
        fields: {
          lat: { doubleValue: -19.98 },
          lng: { doubleValue: 23.42 },
        },
      },
    },
    amenities: {
      arrayValue: {
        values: [{ stringValue: 'WiFi' }, { stringValue: 'Parking' }],
      },
    },
    galleryUrls: {
      arrayValue: {
        values: [{ stringValue: 'https://example.com/guesthouse.jpg' }],
      },
    },
    ...extra,
  };
}
let latest = null;
let pending = [];
const unsubscribe = service.subscribeToGuesthouses(
  (value) => {
    latest = value;
    pending.forEach((check) => check());
  },
  (error) => {
    throw error;
  },
);
const waitFor = (predicate) =>
  new Promise((resolve, reject) => {
    let timer;
    const check = () => {
      if (latest && predicate(latest)) {
        clearTimeout(timer);
        pending = pending.filter((item) => item !== check);
        resolve(latest);
      }
    };
    timer = setTimeout(() => {
      pending = pending.filter((item) => item !== check);
      reject(new Error('Timed out waiting for guesthouses'));
    }, 15000);
    pending.push(check);
    check();
  });
try {
  await waitFor((value) => value.length === 0);
  console.log('PASS: Empty collection returns an empty list without crashing');
  await request(`${base}/${ids[0]}`, 'PATCH', {
    fields: fields('Expensive Lodge', 1250),
  });
  await request(`${base}/${ids[1]}`, 'PATCH', {
    fields: fields('Cheap Lodge', 450, {
      galleryUrls: { arrayValue: { values: [] } },
      logoUrl: { stringValue: 'https://example.com/logo.jpg' },
    }),
  });
  await request(`${base}/${ids[2]}`, 'PATCH', {
    fields: fields('Middle Lodge', 890, {
      amenities: { stringValue: 'not an array' },
      galleryUrls: { stringValue: 'not an array' },
      logoUrl: { nullValue: null },
    }),
  });
  await request(`${base}/${ids[3]}`, 'PATCH', {
    fields: fields('Invalid price', 0, {
      pricePerNight: { stringValue: 'bad' },
    }),
  });
  // A document missing pricePerNight is excluded by Firestore's orderBy constraint.
  await request(`${base}/${ids[4]}`, 'PATCH', {
    fields: { name: { stringValue: 'Incomplete listing' } },
  });
  const listings = await waitFor((value) => value.length === 3);
  assert.deepEqual(
    listings.map((value) => value.pricePerNight),
    [450, 890, 1250],
  );
  assert.deepEqual(
    listings.map((value) => value.name),
    ['Cheap Lodge', 'Middle Lodge', 'Expensive Lodge'],
  );
  console.log(
    'PASS: Logged-out public reads return real documents, cheapest first',
  );
  assert.equal(listings[0].ratingCount, 12);
  assert.equal(listings[0].imageUrl, 'https://example.com/logo.jpg');
  assert.deepEqual(listings[0].location, { lat: -19.98, lng: 23.42 });
  assert.equal(listings[1].imageUrl, null);
  assert.deepEqual(listings[1].amenities, []);
  console.log(
    'PASS: Live ratings, logo fallback, and missing photos/amenities map safely',
  );
  await request(`${base}/${ids[0]}`, 'PATCH', {
    fields: fields('Updated Lodge', 250),
  });
  const updated = await waitFor((value) => value[0]?.name === 'Updated Lodge');
  assert.deepEqual(
    updated.map((value) => value.pricePerNight),
    [250, 450, 890],
  );
  console.log(
    'PASS: Listener updates and reorders listings after a Firestore edit',
  );
  async function search(options, predicate) {
    let stop;
    const result = await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('Search timed out')),
        15000,
      );
      stop = service.subscribeToGuesthouses(
        (list) => {
          if (predicate(list)) {
            clearTimeout(timer);
            resolve(list);
          }
        },
        (error) => {
          clearTimeout(timer);
          reject(error);
        },
        options,
      );
    });
    stop();
    return result;
  }
  const nameMatches = await search(
    { text: '  cHEa  ', field: 'nameLower' },
    (list) => list.length === 1,
  );
  assert.equal(nameMatches[0].name, 'Cheap Lodge');
  const cityMatches = await search(
    { text: 'MA', field: 'cityLower', sort: 'priceDesc' },
    (list) => list.length === 3,
  );
  assert.deepEqual(
    cityMatches.map((item) => item.pricePerNight),
    [890, 450, 250],
  );
  await request(`${base}/${ids[2]}`, 'PATCH', {
    fields: fields('Middle Lodge', 890, {
      averageRating: { doubleValue: 4.9 },
    }),
  });
  const rated = await search(
    { text: 'ma', field: 'cityLower', sort: 'rating', minRating: 4.6 },
    (list) => list.length === 1,
  );
  assert.equal(rated[0].name, 'Middle Lodge');
  const byRating = await search(
    { sort: 'rating' },
    (list) => list.length === 3 && list[0].averageRating === 4.9,
  );
  assert.equal(byRating[0].name, 'Middle Lodge');
  const priced = await search(
    { text: 'ma', field: 'cityLower', minPrice: 400, maxPrice: 500 },
    (list) => list.length === 1,
  );
  assert.equal(priced[0].name, 'Cheap Lodge');
  await search({ text: 'not-found' }, (list) => list.length === 0);
  const changedPrefix = service.subscribeToGuesthouses(
    (value) => {
      latest = value;
      pending.forEach((check) => check());
    },
    (error) => {
      throw error;
    },
    { text: 'cheap' },
  );
  await waitFor((list) => list.length === 1 && list[0].name === 'Cheap Lodge');
  await request(`${base}/${ids[1]}`, 'PATCH', {
    fields: fields('Renamed Lodge', 450),
  });
  await waitFor((list) => list.length === 0);
  changedPrefix();
  console.log(
    'PASS: Case-insensitive name/city prefix queries, price/rating sorts, inclusive filters, no match, and live prefix changes',
  );
  await Promise.all(ids.map((id) => request(`${base}/${id}`, 'DELETE')));
  await waitFor((value) => value.length === 0);
  console.log('PASS: Removing all guesthouses updates the listener to empty');
} finally {
  unsubscribe();
  await Promise.all(ids.map((id) => request(`${base}/${id}`, 'DELETE')));
  await terminate(firestore);
  await deleteApp(app);
}
