import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canUseAdministration } from '../src/lib/adminPolicy.ts';

test('public and ordinary accounts never receive administration', () => {
  assert.equal(canUseAdministration(null, false), false);
  assert.equal(canUseAdministration(null, true), false);
  assert.equal(canUseAdministration({ email: 'visitor@example.com', emailVerified: true }, false), false);
});
test('an unverified owner or member cannot administer', () => {
  assert.equal(canUseAdministration({ email: 'carroceriaypinturanogales@gmail.com', emailVerified: false }, false), false);
  assert.equal(canUseAdministration({ email: 'member@example.com', emailVerified: false }, true), false);
});
test('only verified owner or an explicitly authorized verified member can administer', () => {
  assert.equal(canUseAdministration({ email: 'carroceriaypinturanogales@gmail.com', emailVerified: true }, false), true);
  assert.equal(canUseAdministration({ email: 'member@example.com', emailVerified: true }, true), true);
});
