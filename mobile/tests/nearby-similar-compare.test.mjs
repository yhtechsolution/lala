import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

// Load production TypeScript modules unchanged and run them in a sandbox.
async function load(path, stubs = {}) {
  const source = await readFile(
    new URL(`../src/${path}`, import.meta.url),
    'utf8',
  );
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    { exports, require: (name) => stubs[name] ?? {} },
  );
  return exports;
}
const plain = (value) => JSON.parse(JSON.stringify(value));

const { formatDistance } = await load('services/distance.ts');
const { distanceKm, readCoordinates, mapGuesthouse, sortAndFilterGuesthouses } =
  await load('services/guesthouses.ts', {
    '../config/firebase': { firestore: {} },
  });
const { similarGuesthouses, similarityScore } = await load(
  'services/similar.ts',
);
const { compareGuesthouses } = await load('services/compare.ts');

const maun = { lat: -19.9833, lng: 23.4167 };
const gaborone = { lat: -24.6545, lng: 25.9086 };
const kasane = { lat: -17.8, lng: 25.15 };

// Distance maths and display text.
assert.equal(distanceKm(maun, maun), 0);
const far = distanceKm(maun, gaborone);
assert.ok(
  far > 560 && far < 600,
  `Maun to Gaborone should be about 580 km, got ${far}`,
);
assert.ok(
  Math.abs(distanceKm(maun, gaborone) - distanceKm(gaborone, maun)) < 1e-9,
);
assert.equal(formatDistance(0.4), '400 m away');
assert.equal(formatDistance(0.004), '10 m away');
assert.equal(formatDistance(3.24), '3.2 km away');
assert.equal(formatDistance(12.6), '13 km away');
assert.equal(formatDistance(Number.NaN), '');
assert.equal(formatDistance(-1), '');

// Only real coordinates are accepted.
assert.deepEqual(plain(readCoordinates({ lat: -19.98, lng: 23.41 })), {
  lat: -19.98,
  lng: 23.41,
});
assert.deepEqual(plain(readCoordinates({ lat: 0, lng: 0 })), {
  lat: 0,
  lng: 0,
});
for (const bad of [
  null,
  undefined,
  {},
  { lat: 91, lng: 0 },
  { lat: 0, lng: 181 },
  { lat: '1', lng: '2' },
  { lat: NaN, lng: 1 },
])
  assert.equal(readCoordinates(bad), null);

// mapGuesthouse keeps location and the Setswana description.
const mapped = mapGuesthouse('a', {
  name: 'A',
  pricePerNight: 100,
  location: { lat: -19.98, lng: 23.41 },
  descriptionTn: '  Lodge e e monate.  ',
});
assert.deepEqual(plain(mapped.location), { lat: -19.98, lng: 23.41 });
assert.equal(mapped.descriptionTn, 'Lodge e e monate.');
const bare = mapGuesthouse('b', {
  name: 'B',
  pricePerNight: 100,
  location: { lat: 500, lng: 0 },
});
assert.equal(bare.location, null);
assert.equal(bare.descriptionTn, '');

// Sorting by distance: nearest first, unlocated last, falls back to price without an origin.
const stay = (id, price, location, extra = {}) => ({
  id,
  name: id,
  city: extra.city ?? '',
  country: 'Botswana',
  pricePerNight: price,
  averageRating: extra.rating ?? 0,
  ratingCount: extra.rating ? 5 : 0,
  amenities: extra.amenities ?? [],
  description: '',
  imageUrl: null,
  location,
});
const list = [
  stay('gaborone', 300, gaborone),
  stay('nowhere', 100, null),
  stay('maun', 900, maun),
  stay('kasane', 500, kasane),
];
const order = (options) =>
  Array.from(
    sortAndFilterGuesthouses(list, { field: 'all', ...options }),
    (item) => item.id,
  );
assert.deepEqual(order({ sort: 'distance', origin: maun }), [
  'maun',
  'kasane',
  'gaborone',
  'nowhere',
]);
assert.deepEqual(order({ sort: 'distance', origin: gaborone }), [
  'gaborone',
  'maun',
  'kasane',
  'nowhere',
]);
assert.deepEqual(order({ sort: 'distance' }), [
  'nowhere',
  'gaborone',
  'kasane',
  'maun',
]);
assert.deepEqual(order({ sort: 'priceAsc' }), [
  'nowhere',
  'gaborone',
  'kasane',
  'maun',
]);

// Similar stays: the same city outranks a better amenity match in another city.
const river = stay('river', 600, maun, {
  city: 'Maun',
  rating: 4.5,
  amenities: ['WiFi', 'Pool'],
});
const sameCity = stay('sameCity', 650, maun, {
  city: 'maun',
  rating: 4.2,
  amenities: ['wifi'],
});
const unrelated = stay('unrelated', 150, gaborone, {
  city: 'Gaborone',
  amenities: ['Parking'],
});
const alike = stay('alike', 620, kasane, {
  city: 'Kasane',
  rating: 4.4,
  amenities: ['WiFi', 'Pool'],
});
const all = [river, sameCity, unrelated, alike];
assert.deepEqual(
  Array.from(similarGuesthouses(river, all), (item) => item.id),
  ['sameCity', 'alike'],
);
assert.ok(
  !similarGuesthouses(river, all).some((item) => item.id === 'river'),
  'never suggests itself',
);
assert.equal(similarGuesthouses(river, all, 1).length, 1);
assert.deepEqual(similarGuesthouses(river, [river]), []);
assert.ok(similarityScore(river, alike) > similarityScore(river, unrelated));

// Comparison.
const left = stay('left', 500, maun, {
  city: 'Maun',
  rating: 4.8,
  amenities: ['WiFi', 'Pool', 'Breakfast'],
});
const right = stay('right', 700, maun, {
  city: 'Maun',
  rating: 4.1,
  amenities: ['wifi', 'Parking'],
});
const result = compareGuesthouses(left, right);
const row = (label) => result.rows.find((item) => item.label === label);
assert.equal(row('Price per night').better, 'a');
assert.equal(row('Price per night').a, 'P 500');
assert.equal(row('Guest rating').better, 'a');
assert.equal(row('Amenities').better, 'a');
assert.equal(row('City').better, null);
assert.deepEqual(plain(result.shared), ['WiFi']);
assert.deepEqual(plain(result.onlyA), ['Pool', 'Breakfast']);
assert.deepEqual(plain(result.onlyB), ['Parking']);
// An unrated listing never "wins" on rating, and equal values are ties.
const unrated = compareGuesthouses(
  left,
  stay('new', 500, maun, { city: 'Maun' }),
);
assert.equal(
  unrated.rows.find((item) => item.label === 'Guest rating').better,
  null,
);
assert.equal(
  unrated.rows.find((item) => item.label === 'Guest rating').b,
  'Not rated yet',
);
assert.equal(
  unrated.rows.find((item) => item.label === 'Price per night').better,
  null,
);

console.log(
  'PASS: distance sort, similar stays, comparison and Setswana mapping',
);
