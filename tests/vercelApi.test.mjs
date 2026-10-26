import assert from 'node:assert/strict';
import test from 'node:test';
import { GET } from '../api/hotel-data.js';
import { clearHotelDataCache } from '../server/lark-api.mjs';

test('Vercel endpoint returns actionable configuration errors as uncached JSON', async () => {
  const previousId = process.env.LARK_APP_ID;
  const previousSecret = process.env.LARK_APP_SECRET;
  delete process.env.LARK_APP_ID;
  delete process.env.LARK_APP_SECRET;
  try {
    const response = await GET();
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(response.headers.get('Vercel-CDN-Cache-Control'), 'no-store');
    assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
    const body = await response.json();
    assert.match(body.error, /LARK_APP_ID.*LARK_APP_SECRET/u);
    assert.deepEqual(Object.keys(body), ['error']);
  } finally {
    if (previousId !== undefined) process.env.LARK_APP_ID = previousId;
    if (previousSecret !== undefined) process.env.LARK_APP_SECRET = previousSecret;
  }
});

test('Vercel caches successful responses for 30 seconds with a bounded background refresh', async t => {
  clearHotelDataCache();
  const previousId = process.env.LARK_APP_ID;
  const previousSecret = process.env.LARK_APP_SECRET;
  process.env.LARK_APP_ID = 'test-app';
  process.env.LARK_APP_SECRET = 'test-private-secret';
  let recordsRead = 0;
  t.mock.method(globalThis, 'fetch', async url => {
    if (new URL(url).pathname.endsWith('/auth/v3/tenant_access_token/internal')) {
      return Response.json({ code: 0, tenant_access_token: 'test-private-token', expire: 7200 });
    }
    recordsRead += 1;
    return Response.json({ code: 0, data: { items: [], has_more: false } });
  });
  try {
    for (let i = 0; i < 2; i += 1) {
      const response = await GET();
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('Cache-Control'), 'no-store');
      assert.equal(response.headers.get('Vercel-CDN-Cache-Control'), 'public, s-maxage=30, stale-while-revalidate=30');
      const raw = await response.text();
      assert.equal(raw.includes('test-private-secret'), false);
      assert.equal(raw.includes('test-private-token'), false);
      assert.deepEqual(Object.keys(JSON.parse(raw)), ['branches', 'roomTypes', 'stayDiscounts', 'dateAdjustments', 'items']);
    }
    assert.equal(recordsRead, 10);
  } finally {
    if (previousId === undefined) delete process.env.LARK_APP_ID;
    else process.env.LARK_APP_ID = previousId;
    if (previousSecret === undefined) delete process.env.LARK_APP_SECRET;
    else process.env.LARK_APP_SECRET = previousSecret;
    clearHotelDataCache();
  }
});
