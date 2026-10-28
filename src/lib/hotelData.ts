import { getSupabaseClient } from './supabase';

const isTrue = (value: unknown) => value === true || value === 1 || String(value).toLowerCase() === 'true';

export async function loadHotelData(scope: 'room' | 'items') {
  const client = getSupabaseClient();
  const tables = scope === 'room'
    ? ['branches', 'room_types', 'stay_discounts', 'date_adjustments']
    : ['items'];
  const results = await Promise.all(tables.map(table => client.from(table).select('*')));
  for (const result of results) {
    if (result.error) throw new Error(result.error.message || 'Không tải được dữ liệu từ Supabase.');
    if (!Array.isArray(result.data)) throw new Error('Supabase chưa trả đủ dữ liệu. Vui lòng thử lại.');
  }
  if (scope === 'items') {
    return { items: results[0].data!.map(i => ({
      id: i.id, item_name: i.item_name, kind: i.kind || null,
      quantity: Number(i.quantity || 0), unit_price: Number(i.unit_price || 0),
    })) };
  }
  return {
    branches: results[0].data!,
    roomTypes: results[1].data!.map(r => ({
      id: r.id, branchId: r.branch_id || r.branchId || r.branchid, name: r.name,
      weekdayPrice: Number(r.weekday_price ?? r.weekdayPrice ?? r.weekdayprice ?? 0),
      weekendPrice: Number(r.weekend_price ?? r.weekendPrice ?? r.weekendprice ?? 0),
      isHidden: isTrue(r.is_hidden ?? r.isHidden),
    })).filter(r => !r.isHidden).sort((a, b) => a.weekdayPrice - b.weekdayPrice),
    stayDiscounts: results[2].data!.map(d => ({
      id: d.id, name: d.name, minNights: Number(d.minnights ?? d.min_nights ?? d.minNights ?? 0),
      discountAmount: Number(d.discountamount ?? d.discount_amount ?? d.discountAmount ?? 0),
      isPercentage: isTrue(d.ispercentage ?? d.is_percentage ?? d.isPercentage),
    })).sort((a, b) => b.minNights - a.minNights),
    dateAdjustments: results[3].data!.map(a => ({
      id: a.id, date: a.date, type: a.type, amount: Number(a.amount || 0),
      isPercentage: isTrue(a.ispercentage ?? a.is_percentage ?? a.isPercentage), note: a.note,
    })),
  };
}
