# PLAN.md — Kế hoạch tối ưu tốc độ dự án `hotel-price-calculator`

> Trạng thái: **PLAN (đã xác minh hiện trạng, chưa thực thi)**.
> Mọi con số dưới đây được đo từ mã nguồn và bundle thực tế trong repo, không phải giả định.

## 1. Mục tiêu và phạm vi

**Mục tiêu:** giảm thời gian tải trang đầu tiên, giảm re-render không cần thiết và tăng tốc các thao tác nặng (tính giá so sánh, xuất flyer PNG/ZIP) mà **không thay đổi hành vi nghiệp vụ**.

**Trong phạm vi:** bundle JS/CSS, render React, truy vấn dữ liệu, xuất ảnh flyer, và dọn dẹp thư mục/file thừa.

**Ngoài phạm vi:** thay đổi cấu trúc dữ liệu Supabase/Cloudinary, thiết kế lại giao diện, đổi framework.

## 2. Hiện trạng đã xác minh (baseline)

Stack đã cài (đọc từ `package-lock.json`): Vite 6.4.1, React 19.2.4, `@supabase/supabase-js` 2.98.0, date-fns 4.1.0, motion 12.35.0, html-to-image 1.11.13, jszip 3.10.2, react-day-picker 9.14.0, lucide-react 0.546.0.

Kích thước bundle hiện tại (`dist/assets`, build ngày 31/10):

| File | raw (byte) | gzip (byte) | Ghi chú |
| --- | ---: | ---: | --- |
| `index-CNDnzjy_.js` | 541 238 | 158 628 | Entry chính: React + `App.tsx` + date-fns + supabase-js + icon |
| `App-FdPNd4Zy.js` | 143 109 | 44 567 | Chunk flyer (html-to-image + jszip + file-saver) |
| `CalendarPicker-IBNW8OmH.js` | 58 078 | 17 531 | react-day-picker (lazy) |
| `index-CFQ07w6Q.css` | 48 917 | 9 163 | CSS Tailwind |
| `proxy-D0Abzn1X.js` | 44 930 | 13 631 | motion runtime |
| `gestures-9jWtV7-F.js` | 37 805 | 14 333 | motion gestures |
| `MultiRoomSelector-CKrF1fiS.js` | 15 266 | 4 088 | lazy |
| `MultiRoomSummary-DVWzKnMW.js` | 8 156 | 2 956 | lazy |
| `ItemCompensation-DARPrQIs.js` | 5 799 | 2 205 | lazy |
| `CalendarPicker-3MQXPqBX.css` | 8 129 | 1 706 | CSS của date-picker |

Tổng JS ≈ 864 KB raw / ≈ 257 KB gzip; CSS ≈ 49 KB raw / ≈ 9 KB gzip.

Các đặc điểm đã xác minh:

- Đã có code-splitting: `ItemCompensation`, `MultiRoomSelector`, `MultiRoomSummary`, `FlyerStudio`, `CalendarPicker` được `lazy()`.
- `vite.config.ts` chưa cấu hình `build.rollupOptions.output.manualChunks`, chưa đặt `build.target`.
- `index.html` chỉ preconnect tới `%VITE_SUPABASE_URL%` (nếu biến env trống sẽ sinh link rỗng); chưa preconnect Cloudinary.
- `src/App.tsx` dài 896 dòng, tập trung ~35 state; không component nào dùng `React.memo`.
- `useComparisons` (trong `src/components/useHotelCalculator.ts`) tính lại `calculateForRoomLogic` cho **toàn bộ phòng** ở mọi lần state liên quan đổi.
- `multiRoomSummary` được tính cả khi đang ở chế độ phòng đơn hoặc tab khác.
- Hiệu ứng lưu `sessionStorage` ghi **toàn bộ snapshot JSON** ở mỗi lần đổi state; trình xử lý scroll gọi `readPersistedSession()` (JSON.parse) rồi `setItem` ở mỗi frame scroll.
- Dữ liệu: tab phòng/vật dụng gọi Supabase trực tiếp từ trình duyệt (`src/lib/hotelData.ts`, `select('*')`); tab flyer đi qua serverless `/api/flyer-data` (`server/supabase-data.mjs` dùng phân trang offset).
- Xuất flyer (`src/features/flyer/App.tsx`): `toPng` với `pixelRatio: 3` trên khung 900px (~2700px rộng); mỗi lần tải lại fetch ảnh về base64; xuất ZIP theo vòng lặp tuần tự.

## 3. Điểm nghẽn chính (theo mức ảnh hưởng)

1. Bundle chính 541 KB chứa cả vendor lẫn code app → tải lâu, cache kém hiệu quả khi chỉ đổi code app.
2. `App.tsx` monolith + không memo → mọi cú gõ/nhấn đều re-render gần như toàn bộ cây.
3. `useComparisons` và `multiRoomSummary` tính toán nặng và luôn chạy, kể cả khi không hiển thị.
4. `sessionStorage` được ghi đồng bộ quá thường xuyên (mỗi state đổi + mỗi frame scroll).
5. Truy vấn `select('*')` và phân trang offset kém hiệu quả khi bảng lớn.
6. Xuất PNG/ZIP: pixelRatio cao, lấy ảnh base64 lặp lại, nén ZIP tuần tự.
7. Ảnh flyer không khai báo kích thước → gây layout shift; chưa preconnect Cloudinary.

## 4. Nguyên tắc triển khai

- Mỗi bước phải đo trước/sau (`npm run build`, so sánh `dist/assets`), không tự suy luận "nhanh hơn".
- Thực hiện theo pha, mỗi pha là một commit nhỏ để dễ rollback.
- Giữ nguyên toàn bộ hành vi nghiệp vụ; các thay đổi chỉ ảnh hưởng cơ chế, không đổi kết quả tính tiền.
- Các bước có trade-off (cache dữ liệu, giảm độ phân giải ảnh) được đánh dấu là "cần chốt quyết định".

## 5. Các bước thực hiện (Step-by-step)

### Phase 0 — Thiết lập đo lường

**Bước 0.1 — Lưu baseline và chuẩn hoá cách đo**

- Mục tiêu: có số liệu đối chứng cho mọi bước sau.
- File: không sửa code.
- Yêu cầu kỹ thuật: chạy `npm run build`, ghi lại kích thước raw/gzip từng file `dist/assets` vào mục "Kết quả đo" trong từng PR. Lệnh gợi ý:

```bash
cd dist/assets && for f in *.js *.css; do printf '%-36s raw=%8s gzip=%7s\n' "$f" "$(stat -f%z "$f")" "$(gzip -c "$f" | wc -c | tr -d ' ')"; done
```

- Kiểm chứng: output có đủ các file như bảng mục 2.

**Bước 0.2 — (Tuỳ chọn) Gắn bundle analyzer**

- Mục tiêu: nhìn rõ thành phần chiếm dung lượng trong từng chunk.
- File: `package.json` (devDependency `rollup-plugin-visualizer`), `vite.config.ts` (plugin chỉ bật khi `ANALYZE=true`).
- Điều kiện cần xác minh khi thực thi: cài package cần quyền mạng (phải xin phê duyệt khi chạy).
- Kiểm chứng: chạy `ANALYZE=true npm run build` sinh `stats.html` mở được bằng trình duyệt.

### Phase 1 — Giảm và tách bundle

**Bước 1.1 — Tách vendor bằng `manualChunks` và đặt `build.target`**

- File sửa: `vite.config.ts`.
- Yêu cầu kỹ thuật:
  - Thêm `build: { target: 'es2022', cssCodeSplit: true, reportCompressedSize: true }` (target trùng `lib` trong `tsconfig.json`).
  - Thêm `build.rollupOptions.output.manualChunks` tách các thư viện ổn định, ít thay đổi để browser cache riêng:
    - `react-vendor`: `react`, `react-dom`, `scheduler`.
    - `data-vendor`: `@supabase/supabase-js` (và dependency do Vite gom theo).
    - `date-vendor`: `date-fns`.
    - `motion-vendor`: `motion`.
    - `ui-vendor`: `lucide-react`, `clsx`, `tailwind-merge`.
  - Không đưa các chunk lazy (`html-to-image`, `jszip`, `file-saver`, `react-day-picker`) vào manualChunks để giữ code-splitting hiện tại.
- Kiểm chứng: build thành công, không còn `index-*.js` > 400 KB; các file vendor mới xuất hiện với kích thước hợp lý; tổng gzip không tăng đáng kể; lazy chunks vẫn tồn tại.

**Bước 1.2 — Sửa preconnect trong `index.html`**

- File sửa: `index.html`, `src/lib/supabase.ts` (hoặc `src/main.tsx`).
- Yêu cầu kỹ thuật:
  - Bỏ link `preconnect` tĩnh phụ thuộc `%VITE_SUPABASE_URL%` (đang sinh href rỗng khi thiếu env). Thay bằng việc tạo `link rel=preconnect` lúc runtime ngay khi biết URL Supabase (trong `getSupabaseClient()` hoặc `main.tsx`).
  - Thêm tĩnh `<link rel="preconnect" href="https://res.cloudinary.com" crossorigin />` và `<link rel="dns-prefetch" href="https://res.cloudinary.com" />`.
- Kiểm chứng: mở DevTools → Network, xác nhận preconnect tới `*.supabase.co` và `res.cloudinary.com` xuất hiện; không còn thẻ link href rỗng.

**Bước 1.3 — (Tuỳ chọn) Kiểm tra lại các import không cần thiết**

- File sửa: rà soát import trong `src/App.tsx` và `src/features/flyer/*`.
- Yêu cầu kỹ thuật: dùng `rg` tìm import các module không dùng; giữ nguyên các import có dùng. Không tự ý xoá nếu chưa chắc.
- Kiểm chứng: `npm run typecheck` sạch (không có unused import bị bỏ sót).

### Phase 2 — Giảm re-render React

**Bước 2.1 — Tách `App.tsx` thành các view con**

- File sửa: `src/App.tsx` (tách), tạo mới ví dụ `src/features/room/RoomView.tsx`, `src/features/room/MultiRoomView.tsx`, `src/features/items/ItemsView.tsx` (tên có thể khác).
- Yêu cầu kỹ thuật:
  - `App.tsx` chỉ giữ: tab switcher, state gốc, logic fetch, và render view theo `activeTab`/`roomMode`.
  - Mỗi view nhận props qua `useMemo`/`useCallback` ổn định; không truyền object/function tạo mới mỗi render.
  - State multi-room nên nằm trong `MultiRoomView` để tương tác phòng đơn không làm re-render cây nhiều phòng và ngược lại.
- Kiểm chứng: hành vi 3 tab + chế độ phòng đơn/nhiều phòng giữ nguyên; `npm run typecheck` và `npm test` đạt.

**Bước 2.2 — Bọc `React.memo` cho component hiển thị**

- File sửa: `src/components/PriceSummary.tsx`, `BookingSummary.tsx`, `ComparisonPanel.tsx`, `BranchDropdown.tsx`, `RoomDropdown.tsx`, `SurchargeBanner.tsx`, `GlobalAdjustmentControl.tsx`, `EarlyLateOptions.tsx`, `MultiRoomSummary.tsx`, `MultiRoomSelector.tsx`, `ItemCompensation.tsx`.
- Yêu cầu kỹ thuật:
  - Xuất component bằng `memo(Component)`.
  - Chỉ có tác dụng khi props ổn định, nên phải làm đồng thời Bước 2.3; không memo mà không chuẩn hoá props.
- Kiểm chứng: dùng React DevTools Profiler xác nhận component không render lại khi state không liên quan thay đổi.

**Bước 2.3 — Chuẩn hoá props và callback trong `App.tsx`**

- File sửa: `src/App.tsx` (và các view mới từ Bước 2.1).
- Yêu cầu kỹ thuật:
  - Chuyển mọi arrow function nội tuyến trong JSX (`onClick={() => ...}`, `onSelect={(id) => ...}`) thành `useCallback` hoặc hàm ổn định.
  - Giữ `formatCurrency` ở module scope (đã ổn); không truyền prop là object/array literal mới mỗi render.
  - Đảm bảo dependency array đúng để không làm hỏng hành vi (đặc biệt các handler phụ thuộc `multiRooms`, `branches`, `roomTypes`).
- Kiểm chứng: `npm run typecheck`; test tay toàn bộ thao tác; Profiler cho thấy số render giảm.

**Bước 2.4 — Trì hoãn tính toán nặng**

- File sửa: `src/App.tsx` (hoặc view mới), `src/components/useHotelCalculator.ts`, `src/lib/hotelCalculator.ts`.
- Yêu cầu kỹ thuật:
  - `multiRoomSummary`: chỉ tính khi `activeTab === 'room' && roomMode === 'multi'`; các trường hợp khác trả về kết quả rỗng ổn định.
  - `useComparisons`: không tính khi `activeTab !== 'room'` hoặc khi panel so sánh không hiển thị; nếu cần giữ số liệu sẵn sàng, dùng `useDeferredValue` hoặc debounce 150–300ms cho các input thay đổi liên tục (`checkIn`, `checkOut`, `globalAdjustment.amount`).
  - Thêm cache nội bộ trong `calculateForRoomLogic`/`useComparisons`: `Map` key theo `roomId|checkIn|checkOut|dateAdjustments|stayDiscounts|globalAdjustment|includeVAT|vatRate|earlyLateOptions` để không tính lại cùng một phòng ở nhiều nơi. Nhớ xoá/giới hạn kích thước cache để tránh rò memory.
- Kiểm chứng: Profiler/`performance.now()` quanh `calculateForRoomLogic` khi gõ input cho thấy số lần tính giảm; kết quả tiền không đổi (đối chiếu `npm test`).

**Bước 2.5 — Tối ưu lưu session và scroll**

- File sửa: `src/App.tsx`, tạo `src/lib/session.ts`.
- Yêu cầu kỹ thuật:
  - Tách `scrollY` khỏi snapshot lớn, lưu riêng vào key nhỏ (ví dụ `hotel-price-calculator:scroll:v1`).
  - Thay việc ghi snapshot ở mỗi state đổi bằng ghi debounce ~500ms; vẫn ghi ngay trong `pagehide`.
  - Scroll handler chỉ ghi `window.scrollY` (không `JSON.parse` toàn bộ session); giữ throttle bằng `requestAnimationFrame` như hiện tại.
  - Giữ `try/catch` để app không hỏng khi storage đầy.
- Kiểm chứng: DevTools → Performance, xác nhận `sessionStorage.setItem` không còn chạy ở mỗi frame scroll; thao tác vẫn bình thường và reload vẫn khôi phục đúng trạng thái + vị trí cuộn.

### Phase 3 — Tối ưu dữ liệu

**Bước 3.1 — Chọn cột cụ thể và cache nhẹ ở client**

- File sửa: `src/lib/hotelData.ts`.
- Yêu cầu kỹ thuật:
  - Thay `select('*')` bằng danh sách cột tối thiểu cho từng bảng (branches: `id,name,address`; room_types: `id,branch_id,name,weekday_price,weekend_price,is_hidden`; stay_discounts: `id,name,min_nights,discount_amount,is_percentage`; date_adjustments: `id,date,type,amount,is_percentage,note`; items: `id,item_name,kind,quantity,unit_price`).
  - Thêm cache `sessionStorage` theo `scope` với TTL ngắn (ví dụ 5 phút) + version stamp; nút "Thử lại"/refresh phải có cách ép bypass cache.
  - Lưu ý: cache client làm dữ liệu giá có thể lệch tới khi hết TTL → đây là **quyết định cần chốt** với người dùng nếu freshness là bắt buộc tuyệt đối.
- Kiểm chứng: bật DevTools Network, lần load thứ 2 trong TTL không gọi Supabase; refresh có tham số ép tải lại.

**Bước 3.2 — Chuyển phân trang offset sang keyset**

- File sửa: `server/supabase-data.mjs`.
- Yêu cầu kỹ thuật:
  - Thay vòng lặp `Range: offset-offset+999` bằng keyset pagination: `order=id.asc` + `id=gt.<lastId>` và `limit=1000`, dừng khi trang trả < 1000 dòng.
  - Vẫn giữ `AbortSignal.timeout`, xử lý lỗi, và map `branchid` như hiện tại.
- Kiểm chứng: chạy thử hàm đọc (bằng script tạm ngoài app hoặc qua dev server `/api/flyer-data`) cho kết quả giống hệt số lượng bản ghi; log số request giảm khi bảng lớn.

**Bước 3.3 — (Tuỳ chọn, cần chốt) CDN cache cho `/api/flyer-data`**

- File sửa: `api/flyer-data.mjs`.
- Yêu cầu kỹ thuật:
  - Hiện đang `Cache-Control: no-store`. Nếu chấp nhận trễ dữ liệu, chuyển thành `s-maxage=60, stale-while-revalidate=300` và thêm cache-buster `?t=<timestamp>` khi người dùng bấm "Tải lại dữ liệu" để bypass.
  - Đây là **trade-off freshness/performance**, cần người dùng chốt trước khi thực hiện.
- Kiểm chứng: trên Vercel, hai request liên tiếp trong 60s trả `x-vercel-cache: HIT` (hoặc tiêu đề cache tương ứng); bấm "Tải lại" tạo URL mới không dính cache.

### Phase 4 — Tăng tốc xuất flyer

**Bước 4.1 — Cache ảnh base64 và nén ZIP song song**

- File sửa: `src/features/flyer/App.tsx`.
- Yêu cầu kỹ thuật:
  - Thêm `Map<string, Promise<string>>` module-level cho ảnh đã fetch base64 (key là URL); tái sử dụng giữa các lần tải, có giới hạn kích thước (ví dụ chỉ giữ < 30 URL hoặc flush khi đổi phòng).
  - Xuất ZIP: thay `for...of` tuần tự bằng chạy `captureFlyerToPng` với concurrency có giới hạn (2 ảnh/lượt) để không nổ bộ nhớ với 10 phòng.
  - Vẫn giữ `finally` reset `isDownloading` và bắt lỗi từng phòng.
- Kiểm chứng: tải ZIP lần 2 nhanh hơn rõ rệt (ảnh dùng cache); bộ nhớ không tăng đột biến; file ZIP mở được đúng các PNG.

**Bước 4.2 — Giảm `pixelRatio` (cần chốt)**

- File sửa: `src/features/flyer/App.tsx`.
- Yêu cầu kỹ thuật: giảm `pixelRatio` mặc định từ `3` xuống `2` (900px → 1800px rộng); nếu cần độ phân giải in cao, để người dùng chọn qua UI thay vì cố định 3.
- Kiểm chứng: kích thước PNG đầu ra giảm ~55% diện tích; thời gian `toPng` giảm; chất lượng in vẫn đủ theo yêu cầu thực tế (đây là quyết định cần xác nhận).

**Bước 4.3 — Khai báo kích thước ảnh để giảm layout shift**

- File sửa: `src/features/flyer/components/Flyer.tsx`.
- Yêu cầu kỹ thuật:
  - Thêm `width`/`height` hoặc `aspect-ratio` cho các `<img>`; thêm `decoding="async"`; ảnh hero đầu tiên thêm `fetchPriority="high"`.
  - Giữ `loading="lazy"` cho ảnh dưới fold.
- Kiểm chứng: Lighthouse CLS giảm; không còn cảnh báo "image lacks explicit width/height".

### Phase 5 — Kiểm tra hồi quy và chốt

**Bước 5.1 — Chạy đủ bộ kiểm tra**

- Lệnh: `npm run typecheck`, `npm test`, `npm run build`.
- Kiểm chứng: cả ba lệnh đạt; kích thước bundle mới được ghi lại để so với baseline mục 2.

**Bước 5.2 — Test tay toàn bộ luồng**

- Phòng đơn: đổi chi nhánh/phòng/ngày, phụ thu, VAT, check-in/out sớm muộn, so sánh giá, đặt cọc.
- Nhiều phòng: thêm/nhân/xoá, tick tính tiền, copy báo giá.
- Bồi thường: tìm kiếm, chọn số lượng, tổng tiền.
- Flyer: xem trước, tải PNG đơn, tải ZIP theo toà nhà, nút "Tải lại dữ liệu".
- Kiểm chứng: mọi kết quả tiền khớp với phiên bản trước khi tối ưu (đối chiếu `tests/`).

### Phase 6 — Dọn dẹp thư mục và file thừa

> Đây là dọn vệ sinh repo, độc lập với các pha tối ưu tốc độ ở trên nên có thể làm bất kỳ lúc nào (khuyến nghị làm cuối để tránh xung đột với các bước khác).

**Bước 6.1 — Xoá rác local (an toàn)**

- Mục tiêu: loại bỏ build cũ, metadata Finder và dữ liệu tooling local không thuộc repo.
- Đường dẫn: `dist/`, `.DS_Store`, `src/.DS_Store`, `scripts/` (trống), `.reasonix/`.
- Yêu cầu kỹ thuật:
  - Chạy với đường dẫn tuyệt đối, không dùng wildcard:
    - `rm -rf /Users/minhkhoa/Downloads/Siris/App/siris-internal-work/dist`
    - `rm -f /Users/minhkhoa/Downloads/Siris/App/siris-internal-work/.DS_Store`
    - `rm -f /Users/minhkhoa/Downloads/Siris/App/siris-internal-work/src/.DS_Store`
    - `rmdir /Users/minhkhoa/Downloads/Siris/App/siris-internal-work/scripts` (chỉ khi trống)
    - `rm -rf /Users/minhkhoa/Downloads/Siris/App/siris-internal-work/.reasonix`
  - Thêm dòng `.reasonix/` vào `.gitignore` để không tái xuất hiện.
  - Không xoá `.env`, `.env.local` (chứa khoá, đã bị ignore) và không xoá `node_modules/` trừ khi có ý định cài lại.
- Kiểm chứng: `git status --ignored --short` không còn `!! dist/`, `!! .DS_Store`, `!! .reasonix/`; `npm run build` vẫn tái tạo được `dist/`.

**Bước 6.2 — Xoá file tracked chưa dùng (cần chốt)**

- Mục tiêu: gỡ bỏ file đã được theo dõi bởi git nhưng không còn tham chiếu trong code.
- File: `metadata.json`, `updates/README.md`.
- Yêu cầu kỹ thuật:
  - Xác nhận `metadata.json` không bắt buộc bởi nền tảng triển khai/AI Studio trước khi xoá; hiện không file nào trong repo import nó.
  - `updates/README.md` chỉ là file mẫu ghi chú, không ảnh hưởng runtime; xoá nếu không dùng.
  - Dùng `git rm metadata.json updates/README.md` để xoá khỏi repo; cập nhật `README.md` nếu có tham chiếu (hiện chưa thấy).
- Kiểm chứng: sau khi xoá, `npm run build` và `npm run typecheck` vẫn đạt; `rg` không còn tìm thấy tham chiếu tới hai file này.

## 6. Tổng hợp file cần sửa

| File | Bước | Nội dung chính |
| --- | --- | --- |
| `vite.config.ts` | 1.1, 0.2 | manualChunks, build.target, visualizer (tuỳ chọn) |
| `index.html` | 1.2 | bỏ preconnect Supabase tĩnh, thêm preconnect Cloudinary |
| `src/main.tsx` | 1.2 | tạo preconnect Supabase runtime |
| `src/lib/supabase.ts` | 1.2 | tạo preconnect khi khởi tạo client |
| `src/App.tsx` | 2.1–2.5 | tách view, memo, callback ổn định, trì hoãn tính toán, lưu session debounce |
| `src/lib/session.ts` (mới) | 2.5 | helper đọc/ghi session + scrollY riêng |
| `src/components/useHotelCalculator.ts` | 2.4 | gate `useComparisons`, cache kết quả |
| `src/lib/hotelCalculator.ts` | 2.4 | cache `calculateForRoomLogic` (nếu cần) |
| Các file `src/components/*.tsx` | 2.2 | bọc `React.memo` |
| `src/lib/hotelData.ts` | 3.1 | select cột cụ thể, cache TTL client |
| `server/supabase-data.mjs` | 3.2 | phân trang keyset |
| `api/flyer-data.mjs` | 3.3 | CDN cache (tuỳ chọn, cần chốt) |
| `src/features/flyer/App.tsx` | 4.1, 4.2 | cache base64, ZIP song song, pixelRatio |
| `src/features/flyer/components/Flyer.tsx` | 4.3 | width/height, decoding, fetchPriority |
| `.gitignore` | 6.1 | thêm `.reasonix/` |
| `metadata.json` | 6.2 | xoá nếu xác nhận không dùng |
| `updates/README.md` | 6.2 | xoá nếu xác nhận không dùng |

## 7. Tiêu chí thành công và cách đo

| Chỉ số | Baseline | Mục tiêu | Cách đo |
| --- | ---: | ---: | --- |
| `index-*.js` (entry chính) | 541 KB raw / 158 KB gzip | < 320 KB raw / < 100 KB gzip | `npm run build` + `gzip -c` |
| Số lượng render khi gõ 1 ký tự trong input | toàn cây | chỉ input + phần phụ thuộc | React DevTools Profiler |
| Số lần tính `calculateForRoomLogic` khi gõ input so sánh | ~số phòng × mỗi lần gõ | cache hit, gần như không tính lại | `performance.now()`/Profiler |
| Số lần ghi `sessionStorage` khi scroll | mỗi frame | không ghi full snapshot khi scroll | DevTools → Performance |
| Thời gian xuất ZIP 10 phòng (tải lần 2) | chưa đo | giảm ≥ 30% so với lần 1 | đồng hồ bấm tay + log |

> Các chỉ tiêu thời gian tuyệt đối (LCP/TBT) cần đo bằng Lighthouse trên bản `preview` hoặc Vercel; bước này yêu cầu chạy trình duyệt nên cần phê duyệt khi thực thi.

## 8. Rủi ro và điều kiện còn thiếu

- **Cache client/server (Bước 3.1, 3.3):** đổi lấy tốc độ bằng việc dữ liệu giá có thể trễ vài phút; cần người dùng chốt mức chấp nhận freshness.
- **Giảm `pixelRatio` (Bước 4.2):** ảnh nhỏ/không đủ nét nếu in ấn yêu cầu cao; cần chốt độ phân giải tối thiểu.
- **Đo Lighthouse (Bước 0.2, mục 7):** cần quyền chạy trình duyệt và cài gói phân tích (mạng) → sẽ xin phê duyệt đúng lúc.
- **Supabase RLS:** `select` cột con phải được RLS cho phép đọc các cột đó; cần xác minh khi thực thi Bước 3.1 (nếu RLS cấm cột riêng lẻ, giữ `select('*')` cho bảng đó).
- **Tách `App.tsx` (Bước 2.1):** nguy cơ sai hành vi nếu props/callback không chuẩn; phải chạy đủ test tay ở Bước 5.2 trước khi merge.
- **Xoá `metadata.json` (Bước 6.2):** nếu nền tảng triển khai cần file này, việc xoá có thể ảnh hưởng tới deploy; phải xác nhận nguồn gốc trước khi `git rm`.
