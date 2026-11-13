import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? '';

test('the Google tag loads asynchronously once in the document head', () => {
  const loaders = [...head.matchAll(/<script\b([^>]*)\bsrc="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-KEQ53NB38C"[^>]*><\/script>/g)];
  assert.equal(loaders.length, 1);
  assert.match(loaders[0][1], /\basync\b/);
});

test('the Google tag initializes once and preserves queued events', () => {
  const script = head.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);
  const queuedEvent = ['existing-event'];
  const sandbox = { dataLayer: [queuedEvent] as unknown[] };
  runInNewContext(script, Object.assign(sandbox, { window: sandbox }));
  assert.equal(sandbox.dataLayer[0], queuedEvent);
  assert.equal(sandbox.dataLayer.length, 3);
  const initialization = Array.from(sandbox.dataLayer[1] as ArrayLike<unknown>);
  assert.equal(initialization[0], 'js');
  assert.equal(Object.prototype.toString.call(initialization[1]), '[object Date]');
  assert.deepEqual(Array.from(sandbox.dataLayer[2] as ArrayLike<unknown>), ['config', 'G-KEQ53NB38C']);
});
