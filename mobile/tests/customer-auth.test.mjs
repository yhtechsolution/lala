// Run with Auth + Firestore emulators on localhost (see docs/customer-auth.md).
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, writeFile, rm, mkdtemp } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const { initializeApp, deleteApp } = require('firebase/app');
const {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  getDoc,
  setDoc,
  terminate,
} = require('firebase/firestore');
// Load the actual RN persistence implementation, which Node's default Auth entry omits.
const rnPath = resolve(
  dirname(require.resolve('@firebase/auth')),
  '../rn/index.js',
);
const rn = require(rnPath);
const storageDir =
  process.env.LALA_TEST_STORAGE ||
  (await mkdtemp(resolve(tmpdir(), 'lala-auth-')));
const storage = {
  async getItem(key) {
    try {
      return await readFile(
        resolve(storageDir, encodeURIComponent(key)),
        'utf8',
      );
    } catch (error) {
      if (error.code === 'ENOENT') return null;
      throw error;
    }
  },
  async setItem(key, value) {
    await writeFile(resolve(storageDir, encodeURIComponent(key)), value);
  },
  async removeItem(key) {
    await rm(resolve(storageDir, encodeURIComponent(key)), { force: true });
  },
};
const app = initializeApp(
  { apiKey: 'demo-key', projectId: 'demo-lala-auth', appId: 'demo-app' },
  'customer-auth-test',
);
const auth = rn.initializeAuth(app, {
  persistence: rn.getReactNativePersistence(storage),
});
rn.connectAuthEmulator(auth, 'http://127.0.0.1:9099', {
  disableWarnings: true,
});
const firestore = getFirestore(app);
connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
await auth.authStateReady();

if (process.argv.includes('--restore')) {
  assert.equal(auth.currentUser?.uid || '', process.env.LALA_EXPECT_UID);
  if (process.argv.includes('--sign-out')) await rn.signOut(auth);
  await terminate(firestore);
  await deleteApp(app);
  process.exit(0);
}

// Compile the real service and redirect only its configuration to emulator clients.
// This keeps the tests independent of Expo, .env, and any production credentials.
globalThis.__lalaTestClients = { auth, firestore };
const fixture =
  'data:text/javascript,' +
  encodeURIComponent(
    'export const { auth, firestore } = globalThis.__lalaTestClients;',
  );
const source = await readFile(
  new URL('../src/services/customerAuth.ts', import.meta.url),
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
    "'firebase/auth'",
    JSON.stringify(pathToFileURL(rnPath).href),
  )
  .replaceAll(
    "'firebase/firestore'",
    JSON.stringify(pathToFileURL(require.resolve('firebase/firestore')).href),
  )
  .replaceAll("'../config/firebase'", JSON.stringify(fixture));
const service = await import(
  'data:text/javascript,' + encodeURIComponent(compiled)
);
const password = 'Safari-test-123!';
const email = `customer-${Date.now()}@example.com`;
let passed = 0;
function pass(message) {
  passed++;
  console.log('PASS:', message);
}

try {
  const user = await service.signUpCustomer(
    ` ${email} `,
    password,
    '  Test Traveler  ',
  );
  const profile = (await getDoc(doc(firestore, 'customers', user.uid))).data();
  assert.equal(profile.email, email);
  assert.equal(profile.displayName, 'Test Traveler');
  assert.ok(profile.createdAt.toMillis() > 0);
  assert.equal(user.displayName, 'Test Traveler');
  pass('Signup creates an Auth user and timestamped customer profile');

  await service.saveCustomerProfile(user, 'Test Traveler');
  assert.equal(
    (await getDoc(doc(firestore, 'customers', user.uid)))
      .data()
      .createdAt.toMillis(),
    profile.createdAt.toMillis(),
  );
  pass('Profile retries preserve the original creation timestamp');

  await service.saveCustomerProfile(user, 'Updated Traveler');
  const updatedProfile = (await getDoc(doc(firestore, 'customers', user.uid))).data();
  assert.equal(updatedProfile.displayName, 'Updated Traveler');
  assert.equal(updatedProfile.createdAt.toMillis(), profile.createdAt.toMillis());
  pass('Editing a profile updates its name and preserves the creation timestamp');

  await assert.rejects(
    service.signUpCustomer(email, password, 'Duplicate'),
    (error) =>
      error.code === 'auth/email-already-in-use' &&
      /An account already uses this email/.test(service.authErrorMessage(error)),
  );
  pass('Duplicate email shows a clear sign-in suggestion');

  await assert.rejects(
    setDoc(doc(firestore, 'customers', 'someone-else'), {
      displayName: 'Wrong owner',
    }),
    (error) => error.code === 'permission-denied',
  );
  pass('Firestore rules reject writing another customer profile');

  // Rehydrate from disk in an entirely new process, then confirm sign-out clears it.
  const spawnOptions = {
    env: {
      ...process.env,
      LALA_TEST_STORAGE: storageDir,
      LALA_EXPECT_UID: user.uid,
    },
    stdio: 'pipe',
    timeout: 30000,
  };
  await terminate(firestore);
  await deleteApp(app);
  execFileSync(
    process.execPath,
    [fileURLToPath(import.meta.url), '--restore', '--sign-out'],
    spawnOptions,
  );
  execFileSync(
    process.execPath,
    [fileURLToPath(import.meta.url), '--restore'],
    { ...spawnOptions, env: { ...spawnOptions.env, LALA_EXPECT_UID: '' } },
  );
  pass(
    'RN AsyncStorage persistence survives process restart; sign-out clears the session',
  );
} finally {
  // deleteApp above is intentional: it leaves persistence intact for the restart test.
  await rm(storageDir, { recursive: true, force: true });
}

// A separate app avoids reusing the deleted clients after the restart test.
const secondApp = initializeApp(
  { apiKey: 'demo-key', projectId: 'demo-lala-auth', appId: 'demo-app' },
  'customer-auth-errors',
);
const secondAuth = rn.initializeAuth(secondApp, {
  persistence: rn.inMemoryPersistence,
});
rn.connectAuthEmulator(secondAuth, 'http://127.0.0.1:9099', {
  disableWarnings: true,
});
const secondDb = getFirestore(secondApp);
connectFirestoreEmulator(secondDb, '127.0.0.1', 8080);
globalThis.__lalaTestClients = { auth: secondAuth, firestore: secondDb };
const secondService = await import(
  'data:text/javascript,' +
    encodeURIComponent(compiled.replace(fixture, fixture + '%0A%2F%2Fsecond'))
);
try {
  await assert.rejects(
    secondService.signUpCustomer(
      `weak-${Date.now()}@example.com`,
      '123',
      'Test Traveler',
    ),
    (error) =>
      error.code === 'auth/weak-password' &&
      /stronger password/.test(secondService.authErrorMessage(error)),
  );
  assert.equal(secondAuth.currentUser, null);
  pass('Weak passwords show a clear error without creating a session');

  await assert.rejects(
    secondService.signInCustomer(email, 'Wrong-password'),
    (error) =>
      /Incorrect email or password/.test(secondService.authErrorMessage(error)),
  );
  pass('Wrong credentials produce a clear error');
  await secondService.signInCustomer(` ${email} `, password);
  assert.ok(secondAuth.currentUser);
  pass('Correct credentials sign in successfully');
  await secondService.signOutCustomer();

  // Simulate an app closing after Auth creation but before the Firestore write.
  await rn.createUserWithEmailAndPassword(
    secondAuth,
    `interrupted-${Date.now()}@example.com`,
    password,
  );
  assert.equal(
    (
      await getDoc(doc(secondDb, 'customers', secondAuth.currentUser.uid))
    ).exists(),
    false,
  );
  await secondService.saveCustomerProfile(
    secondAuth.currentUser,
    'Recovered Traveler',
  );
  assert.equal(
    (
      await getDoc(doc(secondDb, 'customers', secondAuth.currentUser.uid))
    ).data().displayName,
    'Recovered Traveler',
  );
  pass(
    'Interrupted signup can finish the customer profile without creating a second account',
  );
  await secondService.resetCustomerPassword(secondAuth.currentUser.email);
  pass('Password reset request succeeds');
  await secondService.signOutCustomer();
} finally {
  await terminate(secondDb);
  await deleteApp(secondApp);
}
console.log(`${passed} authentication checks passed.`);
