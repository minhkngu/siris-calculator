import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

export const LARK_BASE_TOKEN = 'KUKTbQ9cJao9oJsOuxIlDQtVgih';
export const TABLES = {
  branches: { id: 'tblnBd25IKxmXWUP', name: 'branches (cơ sở)' },
  roomTypes: { id: 'tbltQk4cUAgQh2jC', name: 'room_types (loại phòng)' },
  stayDiscounts: { id: 'tbl25YrJ22bB7b7k', name: 'stay_discounts (giảm giá lưu trú)' },
  dateAdjustments: { id: 'tblqrz52mKLrds4m', name: 'date_adjustments (điều chỉnh theo ngày)' },
  items: { id: 'tblclDu4FlVGj33n', name: 'items (vật dụng)' },
};

const API_BASE = 'https://open.larksuite.com/open-apis';
const CACHE_MS = 30_000;
const REQUEST_TIMEOUT_MS = 12_000;
let tokenCache;
let tokenRequest;
let dataCache;
let dataCacheUntil = 0;

export class HotelDataError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = 'HotelDataError';
    this.status = status;
  }
}

function apiCodeMessage(code, fallback) {
  if (code === 99991672) {
    return 'Lark từ chối quyền đọc. Hãy cấp quyền đọc Base cho ứng dụng và thêm ứng dụng vào “Siris Web”.';
  }
  if (code === 99991400) {
    return 'Lark giới hạn số yêu cầu tạm thời. Vui lòng tải lại sau ít phút.';
  }
  return fallback;
}

async function fetchJson(url, options = {}, fetchImpl = fetch) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    let response;
    try {
      response = await fetchImpl(url, {
        ...options,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      if (attempt < 2 && (error.name === 'TimeoutError' || error.name === 'TypeError')) {
        await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)));
        continue;
      }
      throw new HotelDataError('Không kết nối được tới Lark. Kiểm tra mạng rồi thử lại.', 503);
    }

    const body = await response.json().catch(() => null);
    const code = Number(body?.code ?? 0);
    if (response.ok && (body?.code === undefined || code === 0)) return body;

    if (attempt < 2 && (response.status === 429 || response.status >= 500 || code === 99991400)) {
      await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)));
      continue;
    }

    const fallback = `Lark API trả lỗi${code ? ` (${code})` : ` (${response.status})`}.`;
    const error = new HotelDataError(apiCodeMessage(code, fallback), response.status === 401 || response.status === 403 ? 403 : 502);
    error.code = code;
    throw error;
  }
  throw new HotelDataError('Lark đang bận. Vui lòng tải lại sau ít phút.', 503);
}

export async function getTenantAccessToken({ appId, appSecret, fetchImpl = fetch, now = Date.now } = {}) {
  if (!appId || !appSecret) {
    throw new HotelDataError('Chưa cấu hình Lark API. Thêm LARK_APP_ID và LARK_APP_SECRET vào file .env rồi khởi động lại máy chủ.', 503);
  }
  if (tokenCache?.token && tokenCache.expiresAt - now() > 60_000) return tokenCache.token;

  if (!tokenRequest) {
    tokenRequest = (async () => {
      let response;
      try {
        response = await fetchImpl(`${API_BASE}/auth/v3/tenant_access_token/internal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
      } catch {
        throw new HotelDataError('Không kết nối được tới Lark để xác thực. Kiểm tra mạng rồi thử lại.', 503);
      }
      const body = await response.json().catch(() => null);
      if (!response.ok || body?.code !== 0 || !body?.tenant_access_token) {
        const code = Number(body?.code ?? 0);
        if (code === 10003 || code === 10014) {
          throw new HotelDataError('Lark không chấp nhận App ID hoặc App Secret. Kiểm tra lại cấu hình trong .env.', 503);
        }
        throw new HotelDataError(`Không xác thực được với Lark API${code ? ` (${code})` : ` (${response.status})`}. Kiểm tra cấu hình ứng dụng Lark.`, 503);
      }

      tokenCache = {
        token: body.tenant_access_token,
        expiresAt: now() + Number(body.expire ?? 7200) * 1000,
      };
      return tokenCache.token;
    })();
  }

  try {
    return await tokenRequest;
  } finally {
    tokenRequest = undefined;
  }
}

async function listRecords(tableId, tableName, token, fetchImpl = fetch, refreshToken) {
  const records = [];
  let pageToken;
  const seenPageTokens = new Set();
  do {
    const url = new URL(`${API_BASE}/bitable/v1/apps/${LARK_BASE_TOKEN}/tables/${tableId}/records`);
    url.searchParams.set('page_size', '500');
    if (pageToken) url.searchParams.set('page_token', pageToken);
    let currentToken = token;
    let response;
    try {
      response = await fetchJson(url, { headers: { Authorization: `Bearer ${currentToken}` } }, fetchImpl);
    } catch (error) {
      if (!(error instanceof HotelDataError) || ![99991663, 99991668].includes(error.code)) throw error;
      tokenCache = undefined;
      currentToken = await refreshToken();
      response = await fetchJson(url, { headers: { Authorization: `Bearer ${currentToken}` } }, fetchImpl);
    }
    const page = response.data ?? {};
    records.push(...(page.items ?? page.records ?? []));
    if (page.has_more && !page.page_token) {
      throw new HotelDataError(`Lark chưa trả mã trang kế tiếp cho bảng “${tableName}”; dừng để tránh dùng dữ liệu thiếu.`);
    }
    pageToken = page.has_more ? page.page_token : undefined;
    if (pageToken && seenPageTokens.has(pageToken)) {
      throw new HotelDataError(`Lark phân trang bị lặp ở bảng “${tableName}”.`);
    }
    if (pageToken) seenPageTokens.add(pageToken);
  } while (pageToken);
  return records;
}

function readValue(record, field, tableName, { required = false } = {}) {
  const value = record.fields?.[field];
  if (value === null || value === undefined || value === '') {
    if (required) throw new HotelDataError(`Bảng “${tableName}”, bản ghi ${record.record_id}: thiếu trường “${field}”.`);
    return undefined;
  }
  return value;
}

function textValue(value, record, field, tableName, { required = false } = {}) {
  if (value === undefined) {
    if (required) throw new HotelDataError(`Bảng “${tableName}”, bản ghi ${record.record_id}: thiếu trường “${field}”.`);
    return '';
  }
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
  if (Array.isArray(value)) return value.map(part => textValue(part, record, field, tableName)).filter(Boolean).join(', ');
  if (value && typeof value === 'object') return String(value.text ?? value.name ?? '').trim();
  throw new HotelDataError(`Bảng “${tableName}”, bản ghi ${record.record_id}: trường “${field}” không phải văn bản hợp lệ.`);
}

function numberValue(value, record, field, tableName, { required = false, integer = false, min = -Infinity } = {}) {
  if (value === undefined) {
    if (required) throw new HotelDataError(`Bảng “${tableName}”, bản ghi ${record.record_id}: thiếu trường “${field}”.`);
    return 0;
  }
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number) || number < min || (integer && !Number.isInteger(number))) {
    throw new HotelDataError(`Bảng “${tableName}”, bản ghi ${record.record_id}: trường “${field}” không phải số hợp lệ.`);
  }
  return number;
}

function booleanValue(value, record, field, tableName, { required = false } = {}) {
  if (value === undefined) {
    if (required) throw new HotelDataError(`Bảng “${tableName}”, bản ghi ${record.record_id}: thiếu trường “${field}”.`);
    return false;
  }
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number' && (value === 0 || value === 1)) return value === 1;
  const normalized = textValue(value, record, field, tableName).toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  throw new HotelDataError(`Bảng “${tableName}”, bản ghi ${record.record_id}: trường “${field}” phải là true/false.`);
}

function dateValue(value, record, field, tableName) {
  if (value === undefined) throw new HotelDataError(`Bảng “${tableName}”, bản ghi ${record.record_id}: thiếu ngày “${field}”.`);
  if (typeof value === 'number' || (typeof value === 'string' && /^\d{10,13}$/.test(value))) {
    const timestamp = Number(value);
    const date = new Date(timestamp < 100_000_000_000 ? timestamp * 1000 : timestamp);
    if (!Number.isFinite(date.getTime())) throw new HotelDataError(`Bảng “${tableName}”, bản ghi ${record.record_id}: ngày “${field}” không hợp lệ.`);
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(date);
    const byType = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${byType.year}-${byType.month}-${byType.day}`;
  }
  const dateText = textValue(value, record, field, tableName);
  const match = dateText.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (!match) throw new HotelDataError(`Bảng “${tableName}”, bản ghi ${record.record_id}: ngày “${field}” không hợp lệ.`);
  const [, year, month, day] = match;
  const result = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  const [yearNumber, monthNumber, dayNumber] = result.split('-').map(Number);
  const normalizedDate = new Date(Date.UTC(yearNumber, monthNumber - 1, dayNumber));
  if (normalizedDate.getUTCFullYear() !== yearNumber || normalizedDate.getUTCMonth() !== monthNumber - 1 || normalizedDate.getUTCDate() !== dayNumber) {
    throw new HotelDataError(`Bảng “${tableName}”, bản ghi ${record.record_id}: ngày “${field}” không hợp lệ.`);
  }
  return result;
}

function recordId(record, tableName) {
  if (!record.record_id) throw new HotelDataError(`Lark trả về một bản ghi thiếu ID trong bảng “${tableName}”.`);
  return String(record.record_id);
}

function populatedRecords(records, fields) {
  // Lark allows empty placeholder rows, including rows with only a legacy ID.
  // A partially filled business record still reaches the strict validators.
  return records.filter(record => fields.some(field => {
    const value = record.fields?.[field];
    return value !== undefined && value !== null && (typeof value !== 'string' || value.trim() !== '');
  }));
}

export function normalizeHotelRecords(recordsByTable) {
  const branches = populatedRecords(recordsByTable.branches, ['name', 'address']).map(record => {
    const table = TABLES.branches.name;
    return {
      id: recordId(record, table),
      name: textValue(readValue(record, 'name', table, { required: true }), record, 'name', table),
      address: textValue(readValue(record, 'address', table), record, 'address', table) || undefined,
    };
  });
  const branchIds = new Set(branches.map(branch => branch.id));

  const roomTypes = populatedRecords(recordsByTable.roomTypes, ['name', 'braches', 'weekdayprice', 'weekendprice', 'is_hidden']).map(record => {
    const table = TABLES.roomTypes.name;
    const links = readValue(record, 'braches', table, { required: true });
    const linkedIds = (Array.isArray(links) ? links : [links]).flatMap(link => {
      if (typeof link === 'string') return [link];
      if (link?.table_id && link.table_id !== TABLES.branches.id) return [];
      return link?.record_ids ?? [link?.record_id ?? link?.id];
    });
    const uniqueIds = [...new Set(linkedIds)];
    const branchId = uniqueIds[0];
    if (uniqueIds.length !== 1 || typeof branchId !== 'string' || !branchIds.has(branchId)) {
      throw new HotelDataError(`Bảng “${table}”, bản ghi ${record.record_id}: liên kết “braches” không trỏ tới cơ sở hợp lệ.`);
    }
    return {
      id: recordId(record, table),
      branchId,
      name: textValue(readValue(record, 'name', table, { required: true }), record, 'name', table),
      weekdayPrice: numberValue(readValue(record, 'weekdayprice', table, { required: true }), record, 'weekdayprice', table, { required: true, min: 0 }),
      weekendPrice: numberValue(readValue(record, 'weekendprice', table, { required: true }), record, 'weekendprice', table, { required: true, min: 0 }),
      isHidden: booleanValue(readValue(record, 'is_hidden', table), record, 'is_hidden', table),
    };
  });

  const stayDiscounts = populatedRecords(recordsByTable.stayDiscounts, ['name', 'minnights', 'discountamount', 'ispercentage']).map(record => {
    const table = TABLES.stayDiscounts.name;
    return {
      id: recordId(record, table),
      name: textValue(readValue(record, 'name', table, { required: true }), record, 'name', table),
      minNights: numberValue(readValue(record, 'minnights', table, { required: true }), record, 'minnights', table, { required: true, integer: true, min: 0 }),
      discountAmount: numberValue(readValue(record, 'discountamount', table, { required: true }), record, 'discountamount', table, { required: true, min: 0 }),
      isPercentage: booleanValue(readValue(record, 'ispercentage', table, { required: true }), record, 'ispercentage', table, { required: true }),
    };
  });

  const dateAdjustments = populatedRecords(recordsByTable.dateAdjustments, ['date', 'type', 'amount', 'ispercentage', 'note']).map(record => {
    const table = TABLES.dateAdjustments.name;
    const type = textValue(readValue(record, 'type', table, { required: true }), record, 'type', table).toLowerCase();
    if (type !== 'surcharge' && type !== 'discount') {
      throw new HotelDataError(`Bảng “${table}”, bản ghi ${record.record_id}: “type” phải là surcharge hoặc discount.`);
    }
    return {
      id: recordId(record, table),
      date: dateValue(readValue(record, 'date', table, { required: true }), record, 'date', table),
      type,
      amount: numberValue(readValue(record, 'amount', table, { required: true }), record, 'amount', table, { required: true, min: 0 }),
      isPercentage: booleanValue(readValue(record, 'ispercentage', table, { required: true }), record, 'ispercentage', table, { required: true }),
      note: textValue(readValue(record, 'note', table), record, 'note', table),
    };
  });

  const items = populatedRecords(recordsByTable.items, ['item_name', 'kind', 'quantity', 'unit_price']).map(record => {
    const table = TABLES.items.name;
    return {
      id: recordId(record, table),
      item_name: textValue(readValue(record, 'item_name', table, { required: true }), record, 'item_name', table),
      kind: textValue(readValue(record, 'kind', table), record, 'kind', table) || null,
      quantity: numberValue(readValue(record, 'quantity', table, { required: true }), record, 'quantity', table, { required: true, integer: true, min: 0 }),
      unit_price: numberValue(readValue(record, 'unit_price', table, { required: true }), record, 'unit_price', table, { required: true, min: 0 }),
    };
  });

  return {
    branches,
    roomTypes: roomTypes.filter(room => !room.isHidden).sort((a, b) => a.weekdayPrice - b.weekdayPrice),
    stayDiscounts: stayDiscounts.sort((a, b) => b.minNights - a.minNights),
    dateAdjustments,
    items,
  };
}

export async function fetchHotelData({
  appId = process.env.LARK_APP_ID,
  appSecret = process.env.LARK_APP_SECRET,
  fetchImpl = fetch,
  now = Date.now,
} = {}) {
  if (!appId || !appSecret) {
    throw new HotelDataError('Chưa cấu hình Lark API. Thêm LARK_APP_ID và LARK_APP_SECRET vào file .env rồi khởi động lại máy chủ.', 503);
  }
  if (dataCache && dataCacheUntil > now()) return dataCache;

  const token = await getTenantAccessToken({ appId, appSecret, fetchImpl, now });
  const entries = await Promise.all(Object.entries(TABLES).map(async ([key, table]) => {
    const records = await listRecords(
      table.id,
      table.name,
      token,
      fetchImpl,
      () => getTenantAccessToken({ appId, appSecret, fetchImpl, now }),
    );
    return [key, records];
  }));
  const completeData = normalizeHotelRecords(Object.fromEntries(entries));
  dataCache = completeData;
  dataCacheUntil = now() + CACHE_MS;
  return completeData;
}

export function clearHotelDataCache() {
  tokenCache = undefined;
  tokenRequest = undefined;
  dataCache = undefined;
  dataCacheUntil = 0;
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(body));
}

export function createHotelApiServer({ loadData = fetchHotelData } = {}) {
  return createServer(async (request, response) => {
    const host = request.headers.host?.split(':')[0];
    if (host !== '127.0.0.1' && host !== 'localhost') {
      sendJson(response, 403, { error: 'Chỉ cho phép kết nối từ máy tính này.' });
      return;
    }
    if (request.method !== 'GET' || request.url !== '/api/hotel-data') {
      sendJson(response, 404, { error: 'Không tìm thấy API.' });
      return;
    }
    try {
      sendJson(response, 200, await loadData());
    } catch (error) {
      const status = error instanceof HotelDataError ? error.status : 502;
      sendJson(response, status, { error: error instanceof Error ? error.message : 'Không thể tải dữ liệu Lark.' });
    }
  });
}

if (!process.env.VERCEL && process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createHotelApiServer();
  server.listen(5174, '127.0.0.1', () => {
    process.stdout.write('Lark API local server listening at http://127.0.0.1:5174\n');
  });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => server.close(() => process.exit(0)));
  }
}
