import test from 'node:test';
import assert from 'node:assert/strict';
import { isZamirLoginRequest, ZAMIR_ORIGIN, notifyZamirLogout } from './zamir.js';

test('only the expected origin and iframe may request a ticket', () => {
  const frame = {};
  const event = { origin: ZAMIR_ORIGIN, source: frame, data: { type: 'zamir:need-login' } };
  assert.equal(isZamirLoginRequest(event, frame), true);
  assert.equal(isZamirLoginRequest({ ...event, data: 'zamir:need-login' }, frame), true);
  assert.equal(isZamirLoginRequest({ ...event, origin: 'https://other.example' }, frame), false);
  assert.equal(isZamirLoginRequest({ ...event, source: {} }, frame), false);
  assert.equal(isZamirLoginRequest({ ...event, data: { type: 'other' } }, frame), false);
});

test('portal logout synchronously notifies the mounted integration', () => {
  const original = globalThis.window;
  let received;
  globalThis.window = { dispatchEvent: (event) => { received = event.type; } };
  try { notifyZamirLogout(); assert.equal(received, 'portal:logout'); }
  finally { globalThis.window = original; }
});
