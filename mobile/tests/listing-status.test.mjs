import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

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

const guesthouses = await load('services/guesthouses.ts', {
  '../config/firebase': { firestore: {} },
});
const details = await load('services/guesthouseDetails.ts', {
  '../config/firebase': { firestore: {} },
  './guesthouses': guesthouses,
});

const record = (extra = {}) => ({
  name: 'River Lodge',
  pricePerNight: 900,
  ...extra,
});

// Published and legacy (no status) listings are visible.
assert.equal(guesthouses.isPublished(undefined), true);
assert.equal(guesthouses.isPublished('published'), true);
// "active" is the older name for published.
assert.equal(guesthouses.isPublished('active'), true);
assert.ok(guesthouses.mapGuesthouse('a', record({ status: 'active' })));
assert.ok(guesthouses.mapGuesthouse('a', record()));
assert.ok(guesthouses.mapGuesthouse('a', record({ status: 'published' })));

// Draft, hidden and anything unrecognised are kept out.
for (const status of [
  'draft',
  'hidden',
  'suspended',
  'archived',
  '',
  null,
  7,
  'Published',
]) {
  assert.equal(
    guesthouses.isPublished(status),
    false,
    `${String(status)} must not be published`,
  );
  assert.equal(guesthouses.mapGuesthouse('a', record({ status })), null);
  assert.equal(details.mapGuesthouseDetails('a', record({ status })), null);
}
assert.ok(details.mapGuesthouseDetails('a', record({ status: 'published' })));
assert.ok(details.mapGuesthouseDetails('a', record()));

// Hiding applies everywhere a list is built from raw records.
const raw = [
  ['live', record()],
  ['draft', record({ status: 'draft' })],
  ['hidden', record({ status: 'hidden' })],
  ['legacy-published', record({ status: 'published' })],
];
const shown = raw
  .map(([id, data]) => guesthouses.mapGuesthouse(id, data))
  .filter(Boolean)
  .map((item) => item.id);
assert.deepEqual(Array.from(shown), ['live', 'legacy-published']);

console.log('PASS: only published listings reach the mobile app');
