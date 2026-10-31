import { FlyerDataError } from '../server/lark-data.mjs';
import { createSupabaseReader } from '../server/supabase-data.mjs';

const read = createSupabaseReader();

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const start = performance.now();
  try {
    const data = await read();
    res.setHeader('Server-Timing', `supabase;dur=${Math.round(performance.now() - start)}`);
    res.statusCode = 200;
    res.end(JSON.stringify(data));
  } catch (error) {
    res.statusCode = error instanceof FlyerDataError ? error.status : 502;
    res.end(JSON.stringify({ error: error instanceof FlyerDataError ? error.message : 'Không thể tải dữ liệu Supabase. Vui lòng thử lại.' }));
  }
}
