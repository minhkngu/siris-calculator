import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { getCache } from '@vercel/functions';

// Runtime Cache can be shared by projects on a Hobby team. Encrypt tokens with
// the app secret and separate entries by project, environment and credentials.
export function createLarkTokenStore({
  appId,
  appSecret,
  projectId = process.env.VERCEL_PROJECT_ID || 'siris-calculator',
  environment = process.env.VERCEL_ENV || 'development',
  cache = getCache({ namespace: 'siris-lark-auth-v1', keyHashFunction: key => key }),
  now = Date.now,
} = {}) {
  if (!appId || !appSecret) return undefined;
  const identity = JSON.stringify([projectId, environment, appId, appSecret]);
  const key = createHash('sha256').update(identity).digest('hex');
  const encryptionKey = createHash('sha256').update(`encrypt:${identity}`).digest();

  // Cache failures must never prevent normal Lark authentication.
  async function bestEffort(operation) {
    let timeout;
    try {
      return await Promise.race([
        Promise.resolve().then(operation),
        new Promise(resolve => { timeout = setTimeout(resolve, 500); }),
      ]);
    } catch {
      return undefined;
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    async get() {
      return bestEffort(async () => {
        const stored = await cache.get(key);
        if (!stored || typeof stored !== 'string') return undefined;
        const payload = Buffer.from(stored, 'base64');
        const decipher = createDecipheriv('aes-256-gcm', encryptionKey, payload.subarray(0, 12));
        decipher.setAuthTag(payload.subarray(12, 28));
        const plaintext = Buffer.concat([decipher.update(payload.subarray(28)), decipher.final()]);
        const value = JSON.parse(plaintext.toString('utf8'));
        return typeof value.token === 'string' && value.expiresAt - now() > 60_000 ? value : undefined;
      });
    },
    async set(value) {
      const ttl = Math.floor((value.expiresAt - now() - 60_000) / 1000);
      if (ttl <= 0) return;
      return bestEffort(async () => {
        const iv = randomBytes(12);
        const cipher = createCipheriv('aes-256-gcm', encryptionKey, iv);
        const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
        const payload = Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64');
        await cache.set(key, payload, { ttl, name: 'lark-auth' });
      });
    },
  };
}
