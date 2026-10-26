import { fetchHotelData, HotelDataError } from '../server/lark-api.mjs';

export async function GET() {
  const headers = {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  };

  try {
    const data = await fetchHotelData({ cacheTtlMs: 0 });
    return Response.json(data, {
      // Keep the previous response available for a bounded background refresh.
      headers: { ...headers, 'Vercel-CDN-Cache-Control': 'public, s-maxage=30, stale-while-revalidate=30' },
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
