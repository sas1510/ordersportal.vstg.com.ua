import test from 'node:test';
import assert from 'node:assert/strict';
import { isZamirLoginRequest, ZAMIR_ORIGIN, notifyZamirLogout, updateZamirFrameRef } from './zamir.js';

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

test('leaving the page sends logout before clearing the iframe ref', () => {
  const calls = [];
  const ref = { current: null };
  const frame = { contentWindow: { postMessage: (data, origin) => {
    assert.equal(ref.current, frame);
    calls.push({ data, origin });
  } } };
  updateZamirFrameRef(ref, frame);
  assert.equal(calls.length, 0);
  updateZamirFrameRef(ref, frame);
  assert.equal(calls.length, 0);
  updateZamirFrameRef(ref, null);
  assert.deepEqual(calls, [{ data: { type: 'zamir:logout' }, origin: ZAMIR_ORIGIN }]);
  assert.equal(ref.current, null);
  updateZamirFrameRef(ref, null);
  assert.equal(calls.length, 1);
});

test('replacing an iframe logs out the previous session only', () => {
  let oldCalls = 0;
  let newCalls = 0;
  const ref = { current: { contentWindow: { postMessage: () => { oldCalls++; } } } };
  const next = { contentWindow: { postMessage: () => { newCalls++; } } };
  updateZamirFrameRef(ref, next);
  assert.equal(oldCalls, 1);
  assert.equal(newCalls, 0);
  assert.equal(ref.current, next);
});
