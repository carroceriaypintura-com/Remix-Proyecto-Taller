import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ConnectError, UserAuthorizationRequiredError, NoValidTokenError,
  ConnectorInstallationRequiredError,
} from '@vercel/connect';
import { createConnectHandler } from '../server/connect.js';

const identity = { uid: 'verified-firebase-uid', emailVerified: false };
const make = (overrides: Partial<Parameters<typeof createConnectHandler>[0]> = {}) => createConnectHandler({
  authenticate: async () => identity,
  getToken: async () => 'mock-provider-credential',
  startAuthorization: async () => ({
    url: 'https://example.com/consent', verifier: 'private-verifier', request: 'private-request',
  }),
  snowflakeSubject: () => undefined,
  ...overrides,
});
const req = (provider = 'notion', method = 'GET') =>
  new Request(`https://workshop.example/api/connect?provider=${provider}&userId=untrusted`, { method });

test('missing authentication blocks all provider calls', async () => {
  let called = false;
  const result = await make({
    authenticate: async () => { throw new Error('sensitive detail'); },
    getToken: async () => { called = true; return 'secret'; },
  })(req());
  assert.equal(result.status, 401);
  assert.equal(called, false);
  assert.deepEqual(await result.json(), { error: 'authentication_required' });
});
for (const provider of ['notion', 'airefs', 'adobe']) {
  test(`${provider} uses only the verified identity and never returns a token`, async () => {
    const result = await make({ getToken: async (uid, params) => {
      assert.equal(uid, `${provider}/acme-${provider}`);
      assert.deepEqual(params, { subject: { type: 'user', id: identity.uid } });
      return 'sensitive-mock-credential';
    } })(req(provider));
    assert.equal(result.status, 200);
    assert.equal(result.headers.get('cache-control'), 'private, no-store');
    const body = await result.text();
    assert.ok(!body.includes('sensitive-mock-credential'));
    assert.equal(JSON.parse(body).providerOperationTested, false);
  });
}
test('consent only exposes the authorization URL, never verifier or request', async () => {
  const result = await make()(req('notion', 'POST'));
  assert.deepEqual(await result.json(), {
    connector: 'notion/acme-notion', authorizationUrl: 'https://example.com/consent',
  });
});
test('unknown and prototype providers are rejected', async () => {
  for (const value of ['unknown', '__proto__', 'constructor']) {
    assert.equal((await make()(req(value))).status, 400);
  }
});
test('unsupported methods never call a provider', async () => {
  const result = await make()(req('notion', 'DELETE'));
  assert.equal(result.status, 405);
  assert.equal(result.headers.get('allow'), 'GET, POST');
});
for (const [error, status, code] of [
  [new UserAuthorizationRequiredError('sensitive'), 409, 'authorization_required'],
  [new NoValidTokenError('sensitive'), 409, 'authorization_required'],
  [new ConnectorInstallationRequiredError('sensitive'), 409, 'installation_required'],
  [new ConnectError('sensitive', { status: 404 }), 503, 'connector_not_configured'],
  [new ConnectError('sensitive', { status: 403 }), 503, 'connector_not_configured'],
  [new Error('sensitive'), 502, 'provider_unavailable'],
] as const) {
  test(`sanitizes ${error.constructor.name} (${status}/${code})`, async () => {
    const result = await make({ getToken: async () => { throw error; } })(req());
    assert.equal(result.status, status);
    assert.deepEqual(await result.json(), { connector: 'notion/acme-notion', error: code });
  });
}
test('Snowflake shared identity is not accessible to regular users', async () => {
  assert.equal((await make()(req('snowflake'))).status, 403);
});
const admin = { uid: 'admin', email: 'carroceriaypinturanogales@gmail.com', emailVerified: true };
test('Snowflake requires server-side federation configuration', async () => {
  const result = await make({ authenticate: async () => admin })(req('snowflake'));
  assert.equal(result.status, 503);
  assert.equal((await result.json()).error, 'connector_not_configured');
});
test('Snowflake uses a trusted federated subject, not a caller-supplied subject', async () => {
  const result = await make({
    authenticate: async () => admin,
    snowflakeSubject: () => 'configured-service-identity',
    getToken: async (uid, params) => {
      assert.equal(uid, 'snowflake/acme-snowflake');
      assert.deepEqual(params, { subject: { type: 'jwt-bearer', sub: 'configured-service-identity' } });
      return 'sensitive';
    },
  })(req('snowflake'));
  assert.equal(result.status, 200);
});
test('an unverified admin email cannot access Snowflake', async () => {
  assert.equal((await make({ authenticate: async () => ({ ...admin, emailVerified: false }) })(req('snowflake'))).status, 403);
});
