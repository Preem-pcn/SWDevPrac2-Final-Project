// Run with: node scripts/test-booking-cutoff.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(file, dependencies, clock) {
  const exports = {};
  const DateAtTime = class extends Date { static now() { return clock; } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText,
    { exports, Date: DateAtTime, require: name => { if (!(name in dependencies)) throw Error('Unexpected dependency: ' + name); return dependencies[name]; } }, { filename: file });
  return exports;
}
function policy(clock) {
  const date = load('src/lib/date.ts', {}, clock);
  return load('src/lib/booking-policy.ts', { './date': date }, clock);
}
const opening = Date.parse('2026-11-21T10:00:00Z');
test('Bangkok 17:00 boundary: before allowed, exactly at and after locked', () => {
  const { bookingIsLocked } = policy(opening);
  assert.equal(bookingIsLocked('2026-11-21T00:00:00Z', opening - 1), false);
  assert.equal(bookingIsLocked('2026-11-21', opening), true);
  assert.equal(bookingIsLocked('2026-11-21', opening + 1), true);
  assert.equal(bookingIsLocked('2026-11-22', opening), false);
  assert.equal(bookingIsLocked('2026-11-20', opening), true);
});
async function request({ role = 'member', now = opening, method = 'PUT', status = 200 }) {
  const calls = [];
  const route = load('src/app/api/proxy/[...path]/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options.status }) } },
    '@/lib/session': { getSession: async () => ({ token: 'test-token', user: { role: 'admin' } }) },
    '@/lib/booking-policy': policy(now),
    '@/lib/backend': { backend: async (path, options) => {
      calls.push([path, options.method ?? 'GET']);
      if (path === '/auth/me') return { status: 200, json: { success: true, data: { role } } };
      if (!options.method) return { status, json: status === 200 ? { success: true, data: { bookingDate: '2026-11-21T00:00:00Z' } } : { success: false, error: 'Not authorized' } };
      return { status: 200, json: { success: true, data: {} } };
    } },
  }, now);
  // Proposed future date must not bypass the original booking cutoff.
  const result = await route[method]({ method, json: async () => ({ bookingDate: '2026-11-25' }) }, { params: Promise.resolve({ path: ['bookings', 'booking-id'] }) });
  return { result, calls };
}
for (const method of ['PUT', 'DELETE']) {
  test(`member ${method} before opening is forwarded`, async () => {
    const { result, calls } = await request({ method, now: opening - 1 });
    assert.equal(result.status, 200); assert.equal(calls.at(-1)[1], method);
  });
  test(`member ${method} at opening is denied despite forged admin display cookie`, async () => {
    const { result, calls } = await request({ method });
    assert.equal(result.status, 403); assert.match(result.body.error, /contact an admin/);
    assert.equal(calls.some(c => c[1] === method), false);
  });
  test(`admin ${method} after opening is forwarded`, async () => {
    const { result, calls } = await request({ method, role: 'admin', now: opening + 1000 });
    assert.equal(result.status, 200); assert.equal(calls.at(-1)[1], method);
  });
}
test('ownership error from backend is preserved without mutating booking', async () => {
  const { result, calls } = await request({ status: 403 });
  assert.equal(result.status, 403); assert.equal(result.body.error, 'Not authorized');
  assert.equal(calls.some(c => c[1] === 'PUT'), false);
});

test('completed booking message replaces cutoff warning at Bangkok midnight', () => {
  const midnight = Date.parse('2026-11-21T17:00:00Z');
  assert.equal(policy(midnight - 1).bookingDayHasPassed('2026-11-21', midnight - 1), false);
  assert.equal(policy(midnight).bookingDayHasPassed('2026-11-21', midnight), true);
  assert.match(policy(midnight - 1).bookingLockMessage('2026-11-21'), /17:00/);
  assert.doesNotMatch(policy(midnight).bookingLockMessage('2026-11-21'), /17:00/);
  assert.match(policy(midnight).bookingLockMessage('2026-11-21'), /completed/);
});
