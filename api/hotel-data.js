import { fetchHotelData, HotelDataError } from '../server/lark-api.mjs';

export async function GET() {
  const headers = {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  };

  try {
    return Response.json(await fetchHotelData(), { headers });
  } catch (error) {
    const knownError = error instanceof HotelDataError;
    if (!knownError) console.error('Unexpected error loading hotel data from Lark.');
    return Response.json({
      error: knownError ? error.message : 'Không thể tải dữ liệu Lark. Vui lòng thử lại.',
    }, {
      status: knownError ? error.status : 502,
      headers,
    });
  }
}
