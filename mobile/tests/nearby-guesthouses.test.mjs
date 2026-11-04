import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(
  new URL('../src/services/nearbyGuesthouses.ts', import.meta.url),
  'utf8',
);
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { distanceKm, nearbyGuesthouses, nextNearbyGuesthouseId } = await import(
  'data:text/javascript,' + encodeURIComponent(compiled)
);
const maun = { lat: -19.9833, lng: 23.4167 };
const items = [
  { id: 'far', location: { lat: -21.17, lng: 27.5 } },
  { id: 'near', location: { lat: -20.02, lng: 23.44 } },
  { id: 'missing', location: null },
  { id: 'here', location: maun },
];

assert.equal(distanceKm(maun, maun), 0);
assert.ok(distanceKm(maun, items[1].location) < 50);
assert.ok(distanceKm(maun, items[0].location) > 50);
assert.deepEqual(
  nearbyGuesthouses(items, maun).map((item) => item.id),
  ['here', 'near'],
);
assert.deepEqual(
  nearbyGuesthouses(items, maun, 0).map((item) => item.id),
  ['here'],
);
const cards = [{ id: 'first' }, { id: 'second' }, { id: 'third' }];
assert.equal(nextNearbyGuesthouseId(cards, 'first', 1), 'second');
assert.equal(nextNearbyGuesthouseId(cards, 'second', 1), 'third');
assert.equal(nextNearbyGuesthouseId(cards, 'third', 1), 'first');
assert.equal(nextNearbyGuesthouseId(cards, 'second', -1), 'first');
console.log('Nearby guesthouse distance, radius, and ordering checks passed.');
