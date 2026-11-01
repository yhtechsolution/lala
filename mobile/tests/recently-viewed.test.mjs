import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

const source = await readFile(
  new URL('../src/services/recentlyViewed.ts', import.meta.url),
  'utf8',
);
// A tiny in-memory stand-in for AsyncStorage, so the storage functions run for real.
const store = new Map();
const storage = {
  getItem: async (key) => store.get(key) ?? null,
  setItem: async (key, value) => void store.set(key, value),
  removeItem: async (key) => void store.delete(key),
};
const recent = {};
vm.runInNewContext(
  ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  {
    exports: recent,
    require: (name) =>
      name === '@react-native-async-storage/async-storage'
        ? { __esModule: true, default: storage }
        : {},
    JSON,
  },
);
const plain = (value) => JSON.parse(JSON.stringify(value));

// Adding: newest first, no duplicates, capped.
assert.deepEqual(plain(recent.addRecentlyViewed([], 'a')), ['a']);
assert.deepEqual(plain(recent.addRecentlyViewed(['a', 'b'], 'c')), [
  'c',
  'a',
  'b',
]);
assert.deepEqual(plain(recent.addRecentlyViewed(['a', 'b', 'c'], 'b')), [
  'b',
  'a',
  'c',
]);
assert.deepEqual(plain(recent.addRecentlyViewed(['a', 'b'], '')), ['a', 'b']);
const many = Array.from({ length: 10 }, (_, i) => `g${i}`);
const capped = plain(recent.addRecentlyViewed(many, 'new'));
assert.equal(capped.length, 10);
assert.equal(capped[0], 'new');
assert.ok(!capped.includes('g9'), 'the oldest entry is dropped');

// Parsing damaged storage never throws.
assert.deepEqual(plain(recent.parseRecentlyViewed(null)), []);
assert.deepEqual(plain(recent.parseRecentlyViewed('not json')), []);
assert.deepEqual(plain(recent.parseRecentlyViewed('{"a":1}')), []);
assert.deepEqual(plain(recent.parseRecentlyViewed('["a",5,null,"","b","a"]')), [
  'a',
  'b',
]);

// Resolving: newest first, deleted guesthouses skipped, limited.
const listing = (id) => ({ id, name: id });
const listings = ['a', 'b', 'c', 'd'].map(listing);
assert.deepEqual(
  plain(recent.resolveRecentlyViewed(['c', 'gone', 'a'], listings)).map(
    (x) => x.id,
  ),
  ['c', 'a'],
);
assert.deepEqual(
  plain(recent.resolveRecentlyViewed(['a', 'b', 'c', 'd'], listings, 2)).map(
    (x) => x.id,
  ),
  ['a', 'b'],
);
assert.deepEqual(plain(recent.resolveRecentlyViewed([], listings)), []);

// Storage round trip.
assert.deepEqual(plain(await recent.loadRecentlyViewed()), []);
await recent.recordView('a');
await recent.recordView('b');
await recent.recordView('a');
assert.deepEqual(plain(await recent.loadRecentlyViewed()), ['a', 'b']);
await recent.clearRecentlyViewed();
assert.deepEqual(plain(await recent.loadRecentlyViewed()), []);
// A storage failure never breaks the caller.
storage.getItem = async () => {
  throw new Error('disk full');
};
assert.deepEqual(plain(await recent.loadRecentlyViewed()), []);
await recent.recordView('x');

console.log('PASS: recently viewed list, parsing, resolving and storage');
