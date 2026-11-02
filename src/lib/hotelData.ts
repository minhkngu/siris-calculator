import { getSupabaseClient } from './supabase';
import type { Branch, DateAdjustment, Item, RoomType, StayDiscount } from '../components/types';

export interface RoomHotelData {
  branches: Branch[];
  roomTypes: RoomType[];
  stayDiscounts: StayDiscount[];
  dateAdjustments: DateAdjustment[];
}

export interface ItemsHotelData {
  items: Item[];
}

export type HotelData = RoomHotelData | ItemsHotelData;

const isTrue = (value: unknown) => value === true || value === 1 || String(value).toLowerCase() === 'true';

const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_VERSION = 4;
const CACHE_PREFIX = 'hotel-price-calculator:data:v4:';

// Actual Supabase column names. The mapper below still accepts the camelCase /
// snake_case variants so other environments keep working.
const COLUMNS: Record<string, string> = {
  branches: 'id,name,address',
  room_types: 'id,branchid,name,weekdayprice,weekendprice,is_hidden',
  promotions: 'id,name,description,branchid,room_type_id,minnights,stay_start,stay_end,discountamount,ispercentage,discount_basis,max_discount_per_night,max_discount_per_stay,priority,is_active,selection_mode',
  date_adjustments: 'id,date,type,amount,ispercentage,note',
  items: 'id,item_name,kind,quantity,unit_price',
};

// Undefined column / permission denied: fall back to the old wide select.
const SELECT_FALLBACK_CODES = new Set(['42703', '42501', 'PGRST204']);

interface CacheEntry<T> {
  version: number;
  timestamp: number;
  data: T;
}

function readCachedData<T>(scope: 'room' | 'items'): T | null {
  try {
    const raw = sessionStorage.getItem(`${CACHE_PREFIX}${scope}`);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (entry?.version !== CACHE_VERSION || !Number.isFinite(entry.timestamp)) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) return null;
    return entry.data;
  } catch {
    return null;
  }
}

function writeCachedData(scope: 'room' | 'items', data: unknown): void {
  try {
    const entry: CacheEntry<unknown> = { version: CACHE_VERSION, timestamp: Date.now(), data };
    sessionStorage.setItem(`${CACHE_PREFIX}${scope}`, JSON.stringify(entry));
  } catch {
    // Storage may be unavailable or full; the next load simply hits Supabase.
  }
}

export function clearHotelDataCache(): void {
  try {
    sessionStorage.removeItem(`${CACHE_PREFIX}room`);
    sessionStorage.removeItem(`${CACHE_PREFIX}items`);
  } catch {
    // Ignore storage failures.
  }
}

async function selectTable(client: ReturnType<typeof getSupabaseClient>, table: string) {
  const narrow = await client.from(table).select(COLUMNS[table]);
  if (!narrow.error) return narrow;
  if (!SELECT_FALLBACK_CODES.has(narrow.error.code ?? '')) return narrow;
  return client.from(table).select('*');
}

export async function loadHotelData(
  scope: 'room' | 'items',
  options: { forceRefresh?: boolean } = {},
): Promise<HotelData> {
  // Cached data is only a fallback: an internal pricing tool must show price and
  // promotion edits immediately, even when a reload happens inside the TTL.
  const cached = readCachedData<HotelData>(scope);

  try {
    const client = getSupabaseClient();
    const tables = scope === 'room'
      ? ['branches', 'room_types', 'promotions', 'date_adjustments']
      : ['items'];
    const results = await Promise.all(tables.map(table => selectTable(client, table)));
    for (const result of results) {
      if (result.error) throw new Error(result.error.message || 'Không tải được dữ liệu từ Supabase.');
      if (!Array.isArray(result.data)) throw new Error('Supabase chưa trả đủ dữ liệu. Vui lòng thử lại.');
    }
    if (scope === 'items') {
      const data: ItemsHotelData = {
        items: results[0].data!.map(i => ({
          id: i.id, item_name: i.item_name, kind: i.kind || null,
          quantity: Number(i.quantity || 0), unit_price: Number(i.unit_price || 0),
        })),
      };
      writeCachedData(scope, data);
      return data;
    }
    const data: RoomHotelData = {
      branches: results[0].data! as Branch[],
      roomTypes: results[1].data!.map(r => ({
        id: r.id, branchId: r.branch_id || r.branchId || r.branchid, name: r.name,
        weekdayPrice: Number(r.weekday_price ?? r.weekdayPrice ?? r.weekdayprice ?? 0),
        weekendPrice: Number(r.weekend_price ?? r.weekendPrice ?? r.weekendprice ?? 0),
        isHidden: isTrue(r.is_hidden ?? r.isHidden),
      })).filter(r => !r.isHidden).sort((a, b) => a.weekdayPrice - b.weekdayPrice),
      stayDiscounts: results[2].data!.map(d => ({
        id: d.id, name: d.name, description: d.description ?? null, minNights: Number(d.minnights ?? d.min_nights ?? d.minNights ?? 0),
        discountAmount: Number(d.discountamount ?? d.discount_amount ?? d.discountAmount ?? 0),
        isPercentage: isTrue(d.ispercentage ?? d.is_percentage ?? d.isPercentage),
        branchId: d.branchid ?? null, roomTypeId: d.room_type_id ?? null,
        stayStart: d.stay_start ?? null, stayEnd: d.stay_end ?? null,
        discountBasis: d.discount_basis === 'per_night' ? 'per_night' as const : 'per_stay' as const,
        maxDiscountPerNight: d.max_discount_per_night == null ? null : Number(d.max_discount_per_night),
        maxDiscountPerStay: d.max_discount_per_stay == null ? null : Number(d.max_discount_per_stay),
        priority: Number(d.priority ?? 0), isActive: isTrue(d.is_active),
        selectionMode: d.selection_mode === 'manual' ? 'manual' as const : 'automatic' as const,
      })),
      dateAdjustments: results[3].data!.map(a => ({
        id: a.id, date: a.date, type: a.type, amount: Number(a.amount || 0),
        isPercentage: isTrue(a.ispercentage ?? a.is_percentage ?? a.isPercentage), note: a.note,
      })),
    };
    writeCachedData(scope, data);
    return data;
  } catch (error) {
    // Offline or Supabase outage: keep the app usable with the last good data.
    if (!options.forceRefresh && cached) return cached;
    throw error;
  }
}
