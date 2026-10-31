const API = 'https://open.larksuite.com/open-apis';

export class FlyerDataError extends Error {
  constructor(message, status = 502, code = 0) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const text = value => {
  if (value == null) return '';
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join(', ');
  if (typeof value === 'object') return text(value.text ?? value.name ?? value.value ?? value.content);
  return String(value).trim();
};
const hidden = value => text(value).toLowerCase() === 'true';
const normalized = value => text(value).normalize('NFC').toLocaleLowerCase('vi-VN');
const split = value => {
  const input = text(value);
  if (input.includes(';')) return input.split(';').map(v => v.trim()).filter(Boolean);
  const items = [];
  let depth = 0;
  let current = '';
  for (const char of input) {
    if (char === '(') depth++;
    if (char === ')') depth = Math.max(0, depth - 1);
    if (char === ',' && depth === 0) { if (current.trim()) items.push(current.trim()); current = ''; }
    else current += char;
  }
  if (current.trim()) items.push(current.trim());
  return items;
};
const lines = value => text(value).split(/\r?\n/).map(v => v.trim()).filter(Boolean);
const price = value => {
  const raw = text(value);
  if (!raw) return 'N/A';
  const number = Number(raw);
  if (!Number.isFinite(number) || number < 0) throw new FlyerDataError('Lark có giá phòng không hợp lệ.');
  return number > 0 ? `${number.toLocaleString('vi-VN')} VND` : 'N/A';
};
const amenities = fields => {
  const includedVi = split(fields.amenities);
  const excludedVi = split(fields.excluded_amenities);
  return {
    includedVi,
    includedEn: text(fields.amenities_en) ? split(fields.amenities_en) : includedVi,
    excludedVi,
    excludedEn: text(fields.excluded_amenities_en) ? split(fields.excluded_amenities_en) : excludedVi,
  };
};

function linkedId(value) {
  const ids = [...new Set((Array.isArray(value) ? value : [value]).flatMap(link =>
    typeof link === 'string' ? [link] : link?.record_ids ?? [link?.record_id ?? link?.id]).filter(Boolean))];
  return ids.length === 1 ? ids[0] : undefined;
}

function matchByTagOrName(rows, fields) {
  const tagged = text(fields.tag) ? rows.filter(row => normalized(row.fields.tag) === normalized(fields.tag)) : [];
  const matches = tagged.length ? tagged : rows.filter(row => normalized(row.fields.name) === normalized(fields.name));
  if (matches.length > 1) throw new FlyerDataError(`Lark có ánh xạ trùng cho “${text(fields.name)}”.`);
  return matches[0];
}

export function normalizeFlyerData(tables, branchField = 'branch', longBranchField = 'branch') {
  const populated = rows => rows.filter(row => text(row.fields?.name));
  const branches = populated(tables.branches);
  const rooms = populated(tables.roomTypes).filter(row => !hidden(row.fields.is_hidden));
  const longBranches = populated(tables.longBranches);
  const longRooms = populated(tables.longRooms);
  const branchIds = new Set(branches.map(row => row.record_id));
  for (const room of rooms) {
    const id = linkedId(room.fields[branchField]);
    if (!id || !branchIds.has(id)) {
      throw new FlyerDataError(`Phòng “${text(room.fields.name)}” thiếu liên kết cơ sở hợp lệ ở cột “${branchField}”.`);
    }
  }
  return branches.filter(row => !hidden(row.fields.is_hidden)).map(branch => {
    const fields = branch.fields;
    const longBranch = matchByTagOrName(longBranches, fields);
    const branchRooms = rooms.filter(room => linkedId(room.fields[branchField]) === branch.record_id).map(room => {
      const f = room.fields;
      const longRoom = longBranch ? matchByTagOrName(longRooms.filter(r => linkedId(r.fields[longBranchField]) === longBranch.record_id), f) : undefined;
      const sqm = Number(text(f.sqm));
      return {
        id: room.record_id,
        name: text(f.name), nameEn: text(f.name_en) || text(f.name),
        area: Number.isFinite(sqm) && sqm > 0 ? `${sqm}m²` : 'N/A / Not Available',
        priceSunThu: price(f.weekdayprice), priceSunThuEn: 'N/A',
        priceFriSat: price(f.weekendprice), priceFriSatEn: 'N/A',
        priceMonthUnder3: price(f.monthly_under_3), priceMonthUnder3En: 'N/A',
        priceMonthOver3: price(f.monthly_over_3), priceMonthOver3En: 'N/A',
        feesVi: lines(f.fees), feesEn: lines(f.fees_en),
        amenities: amenities(f),
        longTermAmenities: longRoom ? amenities(longRoom.fields) : undefined,
        warningVi: text(f.warning) || undefined, warningEn: text(f.warning_en) || undefined,
        cloudinaryTag: text(fields.tag) && text(f.tag) ? `${text(fields.tag)}_${text(f.tag)}` : undefined,
        imageUrls: [],
      };
    });
    branchRooms.sort((a, b) => Number(a.priceSunThu.replace(/\D/g, '')) - Number(b.priceSunThu.replace(/\D/g, '')));
    return {
      id: branch.record_id, name: text(fields.name), address: text(fields.address),
      policies: text(fields.policies), policiesEn: text(fields.policies_en),
      amenities: amenities(fields), longTermAmenities: longBranch ? amenities(longBranch.fields) : undefined,
      rooms: branchRooms,
    };
  }).filter(branch => branch.rooms.length > 0);
}

export function createLarkReader({ env = process.env, fetchImpl = fetch, wait = ms => new Promise(resolve => setTimeout(resolve, ms)), now = Date.now } = {}) {
  let tokenCache;
  let tokenRequest;
  const branchField = env.LARK_ROOM_BRANCH_FIELD || 'branch';
  const longBranchField = env.LARK_LONGTERM_ROOM_BRANCH_FIELD || 'branch';
  const base = env.LARK_BASE_TOKEN;
  const tables = {
    branches: { id: env.LARK_BRANCHES_TABLE_ID || 'tblnBd25IKxmXWUP', fields: ['name', 'address', 'tag', 'is_hidden', 'policies', 'policies_en', 'amenities', 'amenities_en', 'excluded_amenities', 'excluded_amenities_en'] },
    roomTypes: { id: env.LARK_ROOMS_TABLE_ID || 'tbltQk4cUAgQh2jC', fields: [branchField, 'name', 'name_en', 'tag', 'sqm', 'is_hidden', 'weekdayprice', 'weekendprice', 'monthly_under_3', 'monthly_over_3', 'fees', 'fees_en', 'warning', 'warning_en', 'amenities', 'amenities_en', 'excluded_amenities', 'excluded_amenities_en'] },
    longBranches: { id: env.LARK_LONGTERM_BRANCHES_TABLE_ID || 'tblhl3FKDAP8jaNr', fields: ['name', 'tag', 'amenities', 'amenities_en', 'excluded_amenities', 'excluded_amenities_en'] },
    longRooms: { id: env.LARK_LONGTERM_ROOMS_TABLE_ID || 'tblJefcV2kiRLRtH', fields: ['name', 'tag', longBranchField, 'amenities', 'amenities_en', 'excluded_amenities'] },
  };

  async function request(url, options = {}) {
    for (let attempt = 0; attempt < 3; attempt++) {
      let response;
      try {
        response = await fetchImpl(url, { ...options, signal: AbortSignal.timeout(12_000) });
      } catch {
        if (attempt < 2) { await wait(250 * 2 ** attempt); continue; }
        throw new FlyerDataError('Không kết nối được với Lark. Vui lòng thử lại.', 503);
      }
      const body = await response.json().catch(() => null);
      if (response.ok && body?.code === 0) return body;
      if (attempt < 2 && (response.status === 429 || response.status >= 500 || body?.code === 99991400)) {
        const retryAfter = response.headers.get('retry-after');
        const retryMs = /^\d+(\.\d+)?$/.test(retryAfter || '') ? Number(retryAfter) * 1000 : Math.max(0, Date.parse(retryAfter || '') - now()) || 0;
        await wait(Math.min(5000, Math.max(retryMs, 250 * 2 ** attempt * (0.5 + Math.random()))));
        continue;
      }
      throw new FlyerDataError(`Lark không trả được dữ liệu (mã ${body?.code ?? response.status}). Kiểm tra quyền ứng dụng, tên trường và cấu hình Base.`, 502, body?.code);
    }
  }

  async function token(force = false, rejectedToken) {
    if (force && tokenCache?.token !== rejectedToken && tokenCache?.expiresAt > now() + 60_000) return tokenCache.token;
    if (!force && tokenCache?.expiresAt > now() + 60_000) return tokenCache.token;
    if (!tokenRequest) {
      tokenRequest = (async () => {
        if (!env.LARK_APP_ID || !env.LARK_APP_SECRET || !base) {
          throw new FlyerDataError('Chưa cấu hình LARK_APP_ID, LARK_APP_SECRET và LARK_BASE_TOKEN trên server.', 503);
        }
        const body = await request(`${API}/auth/v3/tenant_access_token/internal`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ app_id: env.LARK_APP_ID, app_secret: env.LARK_APP_SECRET }),
        });
        if (!body.tenant_access_token || !Number.isFinite(Number(body.expire)) || Number(body.expire) <= 0) throw new FlyerDataError('Lark trả token hoặc thời hạn không hợp lệ.');
        tokenCache = { token: body.tenant_access_token, expiresAt: now() + Number(body.expire) * 1000 };
        return tokenCache.token;
      })().finally(() => { tokenRequest = undefined; });
    }
    return tokenRequest;
  }

  async function readTable(table) {
    let accessToken = await token();
    let refreshed = false;
    let pageToken;
    const seen = new Set();
    const records = [];
    do {
      const url = new URL(`${API}/bitable/v1/apps/${encodeURIComponent(base)}/tables/${table.id}/records`);
      url.searchParams.set('page_size', '500');
      url.searchParams.set('field_names', JSON.stringify(table.fields));
      if (pageToken) url.searchParams.set('page_token', pageToken);
      let body;
      try {
        body = await request(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      } catch (error) {
        if (refreshed || ![99991663, 99991668].includes(error.code)) throw error;
        accessToken = await token(true, accessToken);
        refreshed = true;
        body = await request(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      }
      if (!Array.isArray(body.data?.items)) throw new FlyerDataError('Lark trả dữ liệu bảng không hợp lệ.');
      records.push(...body.data.items);
      pageToken = body.data.has_more ? body.data.page_token : undefined;
      if (body.data.has_more && (!pageToken || seen.has(pageToken))) throw new FlyerDataError('Phân trang Lark thiếu hoặc lặp mã trang.');
      if (pageToken) seen.add(pageToken);
    } while (pageToken);
    return records;
  }

  return async () => {
    const entries = await Promise.all(Object.entries(tables).map(async ([key, table]) => [key, await readTable(table)]));
    return { accommodations: normalizeFlyerData(Object.fromEntries(entries), branchField, longBranchField) };
  };
}
