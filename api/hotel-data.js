import { fetchHotelData, HotelDataError } from '../server/lark-api.mjs';
import { createLarkTokenStore } from '../server/lark-token-store.mjs';

export async function GET() {
  const started = performance.now();
  const headers = {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  };

  try {
    const tokenStore = process.env.VERCEL ? createLarkTokenStore({
      appId: process.env.LARK_APP_ID,
      appSecret: process.env.LARK_APP_SECRET,
    }) : undefined;
    const data = await fetchHotelData({ cacheTtlMs: 0, tokenStore });
    const durationMs = Math.round(performance.now() - started);
    console.info(JSON.stringify({ event: 'hotel-data-load', durationMs }));
    return Response.json(data, {
      headers: {
        ...headers,
        'Server-Timing': `lark;dur=${durationMs}`,
        'Vercel-CDN-Cache-Control': 'public, s-maxage=5',
      },
    });
  } catch (error) {
    const knownError = error instanceof HotelDataError;
    if (!knownError) console.error('Unexpected error loading hotel data from Lark.');
    return Response.json({
      error: knownError ? error.message : 'Không thể tải dữ liệu Lark. Vui lòng thử lại.',
    }, {
      status: knownError ? error.status : 502,
      headers: { ...headers, 'Vercel-CDN-Cache-Control': 'no-store' },
    });
  }
}
