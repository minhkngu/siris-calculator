import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clearHotelDataCache,
  createHotelApiServer,
  fetchHotelData,
  getTenantAccessToken,
  normalizeHotelRecords,
  TABLES,
} from '../server/lark-api.mjs';

const rows = {
  branches: [{ record_id: 'branch-1', fields: { name: 'Siris', address: 'Đà Nẵng' } }],
  roomTypes: [
    { record_id: 'room-1', fields: { branch: [{ record_id: 'branch-1', text: 'Siris' }], name: 'Deluxe', weekdayprice: 0, weekendprice: 1500000, is_hidden: 'false' } },
    { record_id: 'room-hidden', fields: { branch: [{ record_id: 'branch-1' }], name: 'Hidden', weekdayprice: 1000000, weekendprice: 1200000, is_hidden: 'true' } },
  ],
  stayDiscounts: [{ record_id: 'discount-1', fields: { name: 'Long stay', minnights: 3, discountamount: 10, ispercentage: 'true' } }],
  dateAdjustments: [{ record_id: 'adjustment-1', fields: { date: Date.UTC(2026, 9, 25, 17), type: 'surcharge', amount: 50000, ispercentage: 'false', note: 'Holiday' } }],
  items: [{ record_id: 'item-1', fields: { item_name: 'Towel', kind: [{ text: 'CÁI' }], quantity: 2, unit_price: 100000 } }],
};

test('normalizes existing Lark rows, linked branches, booleans, zero prices and Vietnam dates', () => {
  const data = normalizeHotelRecords(rows);
  assert.deepEqual(data.branches, [{ id: 'branch-1', name: 'Siris', address: 'Đà Nẵng' }]);
  assert.deepEqual(data.roomTypes, [{ id: 'room-1', branchId: 'branch-1', name: 'Deluxe', weekdayPrice: 0, weekendPrice: 1500000, isHidden: false }]);
  assert.equal(data.stayDiscounts[0].isPercentage, true);
  assert.equal(data.dateAdjustments[0].isPercentage, false);
  assert.equal(data.dateAdjustments[0].date, '2026-10-26');
  assert.equal(data.items[0].id, 'item-1');
  assert.equal(data.items[0].kind, 'CÁI');
});

test('rejects unlinked rooms and invalid prices with record context', () => {
  assert.throws(() => normalizeHotelRecords({
    ...rows,
    roomTypes: [{ record_id: 'broken-room', fields: { branch: [{ record_id: 'missing-branch' }], name: 'Broken', weekdayprice: 1, weekendprice: 1 } }],
  }), /room_types.*broken-room.*branch/u);
  assert.throws(() => normalizeHotelRecords({
    ...rows,
    roomTypes: [{ record_id: 'bad-price', fields: { branch: [{ record_id: 'branch-1' }], name: 'Broken', weekdayprice: 'unknown', weekendprice: 1 } }],
  }), /room_types.*bad-price.*weekdayprice/u);
});

test('reads actual Lark record_ids links and skips only empty placeholder rows', () => {
  const data = normalizeHotelRecords({
    ...rows,
    branches: [...rows.branches, { record_id: 'empty-branch', fields: { room_types: [{ text_arr: [] }] } }],
    roomTypes: [{ ...rows.roomTypes[0], fields: { ...rows.roomTypes[0].fields, branch: [{ record_ids: ['branch-1'], table_id: 'tblnBd25IKxmXWUP' }] } }],
    stayDiscounts: [...rows.stayDiscounts, { record_id: 'empty-discount', fields: { id: '2' } }],
  });
  assert.equal(data.roomTypes[0].branchId, 'branch-1');
  assert.equal(data.branches.length, 1);
  assert.equal(data.stayDiscounts.length, 1);
  assert.throws(() => normalizeHotelRecords({
    ...rows,
    roomTypes: [{ record_id: 'partial-room', fields: { name: 'Missing price' } }],
  }), /partial-room/u);
  assert.throws(() => normalizeHotelRecords({
    ...rows,
    roomTypes: [{ ...rows.roomTypes[0], fields: { ...rows.roomTypes[0].fields, branch: [{ record_ids: ['branch-1', 'another-branch'] }] } }],
  }), /branch/u);
});

test('rejects invalid dates and unsupported boolean strings', () => {
  assert.throws(() => normalizeHotelRecords({
    ...rows,
    dateAdjustments: [{ record_id: 'bad-date', fields: { date: 'not-a-date', type: 'discount', amount: 1, ispercentage: 'false' } }],
  }), /date_adjustments.*bad-date.*date/u);
  assert.throws(() => normalizeHotelRecords({
    ...rows,
    stayDiscounts: [{ record_id: 'bad-boolean', fields: { name: 'Broken', minnights: 1, discountamount: 2, ispercentage: 'maybe' } }],
  }), /stay_discounts.*bad-boolean.*ispercentage/u);
});

test('requires server-side Lark credentials and never calls the network without them', async () => {
  clearHotelDataCache();
  let calls = 0;
  await assert.rejects(fetchHotelData({ appId: '', appSecret: '', fetchImpl: async () => { calls += 1; } }), /LARK_APP_ID.*LARK_APP_SECRET/u);
  assert.equal(calls, 0);
});

test('fetches and caches a complete multi-page dataset from the five existing tables', async () => {
  clearHotelDataCache();
  let calls = 0;
  const fetchImpl = async (url, options = {}) => {
    calls += 1;
    const parsed = new URL(url);
    if (parsed.pathname.endsWith('/auth/v3/tenant_access_token/internal')) {
      assert.equal(options.method, 'POST');
      return Response.json({ code: 0, tenant_access_token: 'private-token', expire: 7200 });
    }
    assert.equal(options.headers.Authorization, 'Bearer private-token');
    const tableId = parsed.pathname.split('/').at(-2);
    const key = Object.keys(rows).find(name => ({
      branches: 'tblnBd25IKxmXWUP', roomTypes: 'tbltQk4cUAgQh2jC', stayDiscounts: 'tbl25YrJ22bB7b7k',
      dateAdjustments: 'tblqrz52mKLrds4m', items: 'tblclDu4FlVGj33n',
    })[name] === tableId);
    assert.deepEqual(JSON.parse(parsed.searchParams.get('field_names')), TABLES[key].fields);
    if (parsed.searchParams.has('page_token')) {
      return Response.json({ code: 0, data: { items: [rows[key][1]], has_more: false } });
    }
    const records = rows[key];
    return Response.json({ code: 0, data: { items: records.slice(0, 1), has_more: records.length > 1, page_token: records.length > 1 ? 'next' : undefined } });
  };

  const first = await fetchHotelData({ appId: 'app', appSecret: 'secret', fetchImpl, now: () => 1_000_000 });
  const callsAfterFirst = calls;
  const second = await fetchHotelData({ appId: 'app', appSecret: 'secret', fetchImpl, now: () => 1_010_000 });
  assert.equal(first, second);
  assert.equal(first.roomTypes.length, 1);
  assert.equal(calls, callsAfterFirst);
});

function datasetFetcher(counts) {
  return async url => {
    const parsed = new URL(url);
    if (parsed.pathname.endsWith('/auth/v3/tenant_access_token/internal')) {
      counts.tokens += 1;
      return Response.json({ code: 0, tenant_access_token: 'private-token', expire: 7200 });
    }
    counts.records += 1;
    const tableId = parsed.pathname.split('/').at(-2);
    const key = Object.keys(TABLES).find(key => TABLES[key].id === tableId);
    return Response.json({ code: 0, data: { items: rows[key], has_more: false } });
  };
}

test('concurrent dataset loads share one complete read of the five tables', async () => {
  clearHotelDataCache();
  const counts = { tokens: 0, records: 0 };
  const options = { appId: 'app', appSecret: 'secret', fetchImpl: datasetFetcher(counts), cacheTtlMs: 0 };
  const results = await Promise.all([fetchHotelData(options), fetchHotelData(options), fetchHotelData(options)]);
  assert.equal(results[0], results[1]);
  assert.equal(results[0], results[2]);
  assert.deepEqual(counts, { tokens: 1, records: 5 });
});

test('production bypasses instance data caches while retaining the tenant token', async () => {
  clearHotelDataCache();
  const counts = { tokens: 0, records: 0 };
  const options = { appId: 'app', appSecret: 'secret', fetchImpl: datasetFetcher(counts), now: () => 1_000_000 };
  const cached = await fetchHotelData(options);
  const fresh = await fetchHotelData({ ...options, cacheTtlMs: 0 });
  const freshAgain = await fetchHotelData({ ...options, cacheTtlMs: 0 });
  assert.notEqual(cached, fresh);
  assert.notEqual(fresh, freshAgain);
  assert.deepEqual(counts, { tokens: 1, records: 15 });
});

test('local dataset cache refreshes after 30 seconds', async () => {
  clearHotelDataCache();
  const counts = { tokens: 0, records: 0 };
  let currentTime = 1_000_000;
  const options = { appId: 'app', appSecret: 'secret', fetchImpl: datasetFetcher(counts), now: () => currentTime, cacheTtlMs: 30_000 };
  const first = await fetchHotelData(options);
  currentTime += 29_999;
  assert.equal(await fetchHotelData(options), first);
  currentTime += 1;
  assert.notEqual(await fetchHotelData(options), first);
  assert.deepEqual(counts, { tokens: 1, records: 10 });
});

test('refreshes expired tenant tokens using the API expiry time', async () => {
  clearHotelDataCache();
  let issued = 0;
  const fetchImpl = async () => {
    issued += 1;
    return Response.json({ code: 0, tenant_access_token: `token-${issued}`, expire: 120 });
  };
  assert.equal(await getTenantAccessToken({ appId: 'app', appSecret: 'secret', fetchImpl, now: () => 1000 }), 'token-1');
  assert.equal(await getTenantAccessToken({ appId: 'app', appSecret: 'secret', fetchImpl, now: () => 2000 }), 'token-1');
  assert.equal(await getTenantAccessToken({ appId: 'app', appSecret: 'secret', fetchImpl, now: () => 62_000 }), 'token-2');
});

test('reissues a tenant token once when Lark rejects the cached token', async () => {
  clearHotelDataCache();
  let issuedTokens = 0;
  let rejectedCachedToken = false;
  const fetchImpl = async (url, options = {}) => {
    const parsed = new URL(url);
    if (parsed.pathname.endsWith('/auth/v3/tenant_access_token/internal')) {
      issuedTokens += 1;
      return Response.json({ code: 0, tenant_access_token: `tenant-${issuedTokens}`, expire: 7200 });
    }
    if (parsed.pathname.includes('/tblnBd25IKxmXWUP/') && options.headers.Authorization === 'Bearer tenant-1' && !rejectedCachedToken) {
      rejectedCachedToken = true;
      return Response.json({ code: 99991668, msg: 'Invalid access token' });
    }
    const tableId = parsed.pathname.split('/').at(-2);
    const tableKey = Object.keys(rows).find(key => ({
      branches: 'tblnBd25IKxmXWUP', roomTypes: 'tbltQk4cUAgQh2jC', stayDiscounts: 'tbl25YrJ22bB7b7k',
      dateAdjustments: 'tblqrz52mKLrds4m', items: 'tblclDu4FlVGj33n',
    })[key] === tableId);
    return Response.json({ code: 0, data: { items: rows[tableKey], has_more: false } });
  };
  let sharedToken;
  let sharedReads = 0;
  const tokenStore = {
    get: async () => { sharedReads += 1; return sharedToken; },
    set: async value => { sharedToken = value; },
  };
  const result = await fetchHotelData({ appId: 'app', appSecret: 'secret', fetchImpl, tokenStore });
  assert.equal(result.branches[0].name, 'Siris');
  assert.equal(issuedTokens, 2);
  assert.equal(sharedReads, 1);
  assert.equal(sharedToken.token, 'tenant-2');
});

test('rejects a truncated page instead of returning partial data', async () => {
  clearHotelDataCache();
  const fetchImpl = async url => {
    if (new URL(url).pathname.endsWith('/auth/v3/tenant_access_token/internal')) {
      return Response.json({ code: 0, tenant_access_token: 'tenant', expire: 7200 });
    }
    return Response.json({ code: 0, data: { items: [], has_more: true } });
  };
  await assert.rejects(fetchHotelData({ appId: 'app', appSecret: 'secret', fetchImpl }), /mã trang kế tiếp/u);
});

test('does not cache an incomplete dataset after a Lark permission error', async () => {
  clearHotelDataCache();
  let recordCalls = 0;
  const fetchImpl = async url => {
    if (new URL(url).pathname.endsWith('/auth/v3/tenant_access_token/internal')) {
      return Response.json({ code: 0, tenant_access_token: 'token', expire: 7200 });
    }
    recordCalls += 1;
    return Response.json({ code: 99991672, msg: 'Access denied' }, { status: 403 });
  };
  const failedBatch = await Promise.allSettled(Array.from({ length: 3 }, () => fetchHotelData({ appId: 'app', appSecret: 'secret', fetchImpl })));
  for (const result of failedBatch) {
    assert.equal(result.status, 'rejected');
    assert.match(result.reason.message, /quyền đọc Base/u);
  }
  await assert.rejects(fetchHotelData({ appId: 'app', appSecret: 'secret', fetchImpl }), /quyền đọc Base/u);
  assert.equal(recordCalls, 10);
});

test('scoped requests read only their tables, deduplicate per scope and keep caches separate', async () => {
  clearHotelDataCache();
  const counts = { tokens: 0, records: 0 };
  const options = { appId: 'app', appSecret: 'secret', fetchImpl: datasetFetcher(counts), cacheTtlMs: 30_000 };
  const [room, sameRoom, items] = await Promise.all([
    fetchHotelData({ ...options, scope: 'room' }),
    fetchHotelData({ ...options, scope: 'room' }),
    fetchHotelData({ ...options, scope: 'items' }),
  ]);
  assert.equal(room, sameRoom);
  assert.deepEqual(Object.keys(room), ['branches', 'roomTypes', 'stayDiscounts', 'dateAdjustments']);
  assert.deepEqual(Object.keys(items), ['items']);
  assert.equal(room.roomTypes[0].id, 'room-1');
  assert.equal(items.items[0].id, 'item-1');
  assert.deepEqual(counts, { tokens: 1, records: 5 });
  assert.equal(await fetchHotelData({ ...options, scope: 'items' }), items);
  assert.equal(await fetchHotelData({ ...options, scope: 'room' }), room);
  assert.equal(counts.records, 5);
  assert.deepEqual(Object.keys(await fetchHotelData(options)), Object.keys(TABLES));
  assert.equal(counts.records, 10);
});

test('scope validation rejects invalid scopes and missing requested tables', async () => {
  await assert.rejects(fetchHotelData({ scope: 'invalid' }), error => error.status === 400);
  assert.throws(() => normalizeHotelRecords({ ...rows, items: undefined }, 'items'), /chưa trả đủ/u);
  assert.throws(() => normalizeHotelRecords({ ...rows, roomTypes: undefined }, 'room'), /chưa trả đủ/u);
  const invalidItems = { ...rows, items: [{ record_id: 'broken-item', fields: { item_name: 'Broken' } }] };
  assert.equal(normalizeHotelRecords(invalidItems, 'room').roomTypes.length, 1);
  assert.throws(() => normalizeHotelRecords(invalidItems, 'items'), /broken-item/u);
  assert.deepEqual(Object.keys(normalizeHotelRecords({ items: rows.items }, 'items')), ['items']);
});

test('an items permission error does not block room loading and is not cached', async () => {
  clearHotelDataCache();
  const counts = { tokens: 0, records: 0 };
  const original = datasetFetcher(counts);
  let denyItems = true;
  const options = { appId: 'app', appSecret: 'secret', fetchImpl: async url => {
    if (denyItems && String(url).includes(TABLES.items.id)) return Response.json({ code: 99991672 }, { status: 403 });
    return original(url);
  } };
  const [room, items] = await Promise.allSettled([
    fetchHotelData({ ...options, scope: 'room' }), fetchHotelData({ ...options, scope: 'items' }),
  ]);
  assert.equal(room.status, 'fulfilled');
  assert.equal(items.status, 'rejected');
  denyItems = false;
  assert.equal((await fetchHotelData({ ...options, scope: 'items' })).items[0].id, 'item-1');
});

test('rejects a missing Lark table payload instead of accepting an empty table', async () => {
  clearHotelDataCache();
  const fetchImpl = async url => new URL(url).pathname.includes('/auth/')
    ? Response.json({ code: 0, tenant_access_token: 'token', expire: 7200 })
    : Response.json({ code: 0, data: {} });
  await assert.rejects(fetchHotelData({ scope: 'items', appId: 'app', appSecret: 'secret', fetchImpl }), /chưa trả đủ/u);
});


test('local API parses scoped URLs and defaults to all', async () => {
  const scopes = [];
  const server = createHotelApiServer({ loadData: async ({ scope }) => { scopes.push(scope); return { scope }; } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const origin = `http://127.0.0.1:${server.address().port}`;
    for (const scope of ['room', 'items', 'all']) {
      const response = await fetch(`${origin}/api/hotel-data?scope=${scope}`);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { scope });
    }
    assert.deepEqual(await (await fetch(`${origin}/api/hotel-data`)).json(), { scope: 'all' });
    assert.equal((await fetch(`${origin}/api/hotel-data?scope=bad`)).status, 400);
    assert.deepEqual(scopes, ['room', 'items', 'all', 'all']);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
