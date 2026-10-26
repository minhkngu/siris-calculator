import assert from 'node:assert/strict';
import test from 'node:test';
import { createLarkTokenStore } from '../server/lark-token-store.mjs';
import { clearHotelDataCache, getTenantAccessToken } from '../server/lark-api.mjs';

function fixture() {
  const entries = new Map();
  const writes = [];
  const cache = {
    get: async key => entries.get(key),
    set: async (key, value, options) => { entries.set(key, value); writes.push({ key, value, options }); },
  };
  const options = { appId: 'test-app', appSecret: 'test-secret', projectId: 'test-project', environment: 'production', cache, now: () => 1000 };
  return { entries, writes, options, store: createLarkTokenStore(options) };
}

test('shares encrypted auth across instances without another Lark authentication', async () => {
  clearHotelDataCache();
  const { store, writes, options } = fixture();
  let calls = 0;
  const authOptions = {
    appId: options.appId, appSecret: options.appSecret, tokenStore: store, now: options.now,
    fetchImpl: async () => {
      calls += 1;
      return Response.json({ code: 0, tenant_access_token: `private-token-${calls}`, expire: 7200 });
    },
  };
  assert.equal(await getTenantAccessToken(authOptions), 'private-token-1');
  clearHotelDataCache(); // Simulate a new function instance with no process memory.
  assert.equal(await getTenantAccessToken(authOptions), 'private-token-1');
  assert.equal(calls, 1);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].options.ttl, 7140);
  assert.equal(writes[0].value.includes('private-token'), false);
  assert.equal(writes[0].key.includes('test-secret'), false);

  // A token rejected by Lark must bypass both caches and replace the shared copy.
  assert.equal(await getTenantAccessToken({ ...authOptions, forceRefresh: true }), 'private-token-2');
  clearHotelDataCache();
  assert.equal(await getTenantAccessToken(authOptions), 'private-token-2');
  assert.equal(calls, 2);
  clearHotelDataCache();
});

test('rejects expired, tampered and cross-project or rotated-credential tokens', async () => {
  const { store, entries, options } = fixture();
  await store.set({ token: 'private-token', expiresAt: 121_000 });
  assert.equal((await store.get()).token, 'private-token');
  for (const change of [{ projectId: 'another-project' }, { environment: 'preview' }, { appSecret: 'rotated-secret' }, { now: () => 61_000 }]) {
    assert.equal(await createLarkTokenStore({ ...options, ...change }).get(), undefined);
  }
  const key = entries.keys().next().value;
  entries.set(key, Buffer.alloc(40).toString('base64'));
  assert.equal(await store.get(), undefined);
});

test('cache outage falls back to Lark and cache deadlines do not block authentication', async () => {
  clearHotelDataCache();
  const { options } = fixture();
  const tokenStore = createLarkTokenStore({ ...options, cache: {
    get: async () => { throw new Error('cache unavailable'); },
    set: async () => { throw new Error('cache unavailable'); },
  } });
  const token = await getTenantAccessToken({ ...options, tokenStore, fetchImpl: async () => Response.json({ code: 0, tenant_access_token: 'fallback', expire: 7200 }) });
  assert.equal(token, 'fallback');
  const stalled = createLarkTokenStore({ ...options, cache: { get: () => new Promise(() => {}) } });
  assert.equal(await stalled.get(), undefined);
  clearHotelDataCache();
});
