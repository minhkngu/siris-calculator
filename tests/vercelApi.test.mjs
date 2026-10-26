import assert from 'node:assert/strict';
import test from 'node:test';
import { GET } from '../api/hotel-data.js';

test('Vercel endpoint returns actionable configuration errors as uncached JSON', async () => {
  const previousId = process.env.LARK_APP_ID;
  const previousSecret = process.env.LARK_APP_SECRET;
  delete process.env.LARK_APP_ID;
  delete process.env.LARK_APP_SECRET;
  try {
    const response = await GET();
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
    const body = await response.json();
    assert.match(body.error, /LARK_APP_ID.*LARK_APP_SECRET/u);
    assert.deepEqual(Object.keys(body), ['error']);
  } finally {
    if (previousId !== undefined) process.env.LARK_APP_ID = previousId;
    if (previousSecret !== undefined) process.env.LARK_APP_SECRET = previousSecret;
  }
});
