import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

// Exercise production search logic with the real record shape, including unrated stays.
const records = [
  {
    id: 'river',
    name: 'River Lodge',
    city: 'Gaborone',
    pricePerNight: 600,
    averageRating: 4.9,
    ratingCount: 5,
  },
  {
    id: 'garden',
    name: 'Garden Stay',
    city: 'Gaborone',
    pricePerNight: 300,
    averageRating: 4.1,
    ratingCount: 3,
  },
  {
    id: 'new',
    name: 'New Stay',
    city: 'Gaborone',
    pricePerNight: 450,
    averageRating: 0,
    ratingCount: 0,
  },
];
let queryParts;
const firebase = {
  collection: () => 'guesthouses',
  orderBy: (...args) => args,
  where: (...args) => args,
  query: (...args) => {
    queryParts = args;
    return args;
  },
  onSnapshot: () => () => {},
};
const source = await readFile(
  new URL('../src/services/guesthouses.ts', import.meta.url),
  'utf8',
);
const exports = {};
vm.runInNewContext(
  ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  {
    exports,
    require: (name) =>
      name === '../config/firebase' ? { firestore: {} } : firebase,
  },
);
const ids = (options) =>
  Array.from(
    exports.sortAndFilterGuesthouses(records, options),
    (item) => item.id,
  );
assert.deepEqual(ids({ field: 'all', text: ' GABO ' }), [
  'garden',
  'new',
  'river',
]);
assert.deepEqual(ids({ field: 'all', text: 'rIvEr' }), ['river']);
assert.deepEqual(ids({ field: 'all', text: 'bor' }), [
  'garden',
  'new',
  'river',
]);
assert.deepEqual(ids({ field: 'all', text: 'gabo', sort: 'rating' }), [
  'river',
  'garden',
  'new',
]);
assert.deepEqual(ids({ field: 'all', minPrice: 400, maxPrice: 500 }), ['new']);
assert.deepEqual(ids({ field: 'all', minRating: 4.5 }), ['river']);
assert.deepEqual(ids({ field: 'all', text: 'missing' }), []);
assert.deepEqual(
  records.map((item) => item.id),
  ['river', 'garden', 'new'],
);
exports.subscribeToGuesthouses(
  () => {},
  () => {},
  { field: 'all', sort: 'rating', text: 'gabo' },
);
assert.deepEqual(
  queryParts,
  ['guesthouses', ['pricePerNight', 'asc']],
  'combined search must not exclude records with missing rating or lowercase fields',
);
console.log(
  'Search acceptance checks passed, including preservation of unrated listings.',
);
