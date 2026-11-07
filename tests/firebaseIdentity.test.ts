import assert from 'node:assert/strict';
import test from 'node:test';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { FIREBASE_PROJECT_ID, verifyFirebaseIdToken, authenticate } from '../server/firebaseIdentity.js';

const { privateKey, publicKey } = await generateKeyPair('RS256');
const keys = createLocalJWKSet({ keys: [{ ...await exportJWK(publicKey), kid: 'local-test-key' }] });
const now = Math.floor(Date.now() / 1000);
async function sign(overrides = {}) {
  return new SignJWT({
    iss: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
    aud: FIREBASE_PROJECT_ID, sub: 'real-uid', iat: now - 10, exp: now + 600,
    auth_time: now - 60, email: 'someone@example.com', email_verified: true,
    ...overrides,
  }).setProtectedHeader({ alg: 'RS256', kid: 'local-test-key' }).sign(privateKey);
}
test('accepts correctly signed Firebase identity', async () => {
  assert.deepEqual(await verifyFirebaseIdToken(await sign(), keys), {
    uid: 'real-uid', email: 'someone@example.com', emailVerified: true,
  });
});
for (const [name, claims] of [
  ['wrong issuer', { iss: 'https://attacker.example' }],
  ['wrong audience', { aud: 'other-project' }],
  ['expired', { exp: now - 30 }],
  ['future issued-at', { iat: now + 600 }],
  ['future authentication', { auth_time: now + 600 }],
  ['missing uid', { sub: '' }],
  ['missing authentication time', { auth_time: undefined }],
] as const) {
  test(`rejects ${name}`, async () => {
    await assert.rejects(verifyFirebaseIdToken(await sign(claims), keys));
  });
}
test('rejects tampered signatures', async () => {
  const token = await sign();
  const parts = token.split('.');
  parts[1] = Buffer.from(JSON.stringify({ sub: 'attacker' })).toString('base64url');
  await assert.rejects(verifyFirebaseIdToken(parts.join('.'), keys));
});
test('missing bearer token and malformed bearer are rejected before network access', async () => {
  for (const authorization of ['', 'Basic not-a-token', 'Bearer a b']) {
    await assert.rejects(authenticate(new Request('https://example.com', { headers: { authorization } })));
  }
});
