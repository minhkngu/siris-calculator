import { normalizeFlyerData, FlyerDataError } from './lark-data.mjs';

const tables = {
  branches: 'branches', roomTypes: 'room_types',
  longBranches: 'longterm_branches', longRooms: 'longterm_room_types',
};

export function createSupabaseReader({ env = process.env, fetchImpl = fetch } = {}) {
  return async () => {
    const { SUPABASE_URL: url, SUPABASE_PUBLISHABLE_KEY: key } = env;
    if (!url || !key) throw new FlyerDataError('Chưa cấu hình SUPABASE_URL và SUPABASE_PUBLISHABLE_KEY trên server.', 503);
    const entries = await Promise.all(Object.entries(tables).map(async ([name, table]) => {
      const rows = [];
      for (let offset = 0; ; offset += 1000) {
        let response;
        try {
          const endpoint = new URL(`/rest/v1/${table}`, url);
          endpoint.searchParams.set('select', '*');
          endpoint.searchParams.set('order', 'id.asc');
          response = await fetchImpl(endpoint, { headers: { apikey: key, Authorization: `Bearer ${key}`, Range: `${offset}-${offset + 999}` }, signal: AbortSignal.timeout(12000) });
        } catch { throw new FlyerDataError('Không kết nối được với Supabase. Vui lòng thử lại.', 503); }
        if (!response.ok) throw new FlyerDataError(`Supabase không trả được dữ liệu (${response.status}).`, 502);
        const page = await response.json();
        if (!Array.isArray(page)) throw new FlyerDataError('Supabase trả dữ liệu không hợp lệ.');
        rows.push(...page);
        if (page.length < 1000) break;
      }
      return [name, rows.map(row => ({ record_id: row.id, fields: { ...row, branch: row.branchid } }))];
    }));
    return { accommodations: normalizeFlyerData(Object.fromEntries(entries)) };
  };
}
