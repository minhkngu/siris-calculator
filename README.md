# Phần mềm nội bộ Siris Residences

Phần mềm quản lý nội bộ dành cho Siris Residences — hỗ trợ tính tiền phòng linh hoạt và tính tiền bồi thường vật dụng.

## Tính năng

### Tính tiền phòng
- **Đa chi nhánh & loại phòng**: Lựa chọn và so sánh giá giữa các cơ sở.
- **Giá linh hoạt**: Giá riêng cho ngày thường (CN-T5) và cuối tuần (T6-T7).
- **Phụ thu/giảm giá theo ngày**: Tự động áp dụng cho ngày lễ, ngày đặc biệt.
- **Giảm giá theo số đêm**: Tự động chọn ưu đãi tốt nhất dựa trên thời gian lưu trú.
- **Điều chỉnh tổng đơn**: Phụ thu/giảm giá toàn bộ hóa đơn (% hoặc số tiền).
- **VAT**: Tùy chọn bao gồm thuế GTGT, có thể điều chỉnh %.
- **Check-in sớm / Check-out trễ**: 5 tùy chọn phí — từ 8:00 (50% giá đêm trước), từ 12:30, từ 13:00, trả phòng trước 13:00, trả phòng trước 18:00 (80% giá đêm sau, không áp dụng trả phòng vào Thứ 6 & Thứ 7).
- **So sánh lựa chọn**: Bảng so sánh giá giữa các phòng/chi nhánh, hiển thị chênh lệch.
- **Đặt cọc**: Tự động tính 50% đặt cọc.

### Tính tiền nhiều phòng
- **Chế độ nhiều phòng**: Chuyển đổi giữa "Phòng đơn" và "Nhiều phòng".
- **Thêm / nhân bản / xoá phòng**: Cấu hình tối đa 10 phòng cùng lúc, mỗi phòng có chi nhánh, loại phòng, thời gian lưu trú và dịch vụ riêng.
- **Tổng hợp tự động**: Gộp tổng tiền gốc, giảm giá lưu trú, phí nhận sớm/trả trễ, điều chỉnh tổng đơn, VAT và đặt cọc của toàn bộ các phòng.
- **Tick để tính tiền**: Bỏ chọn từng phòng nếu không muốn tính vào tổng hoá đơn.
- **Sao chép bảng báo giá**: Tự động tạo và sao chép văn bản báo giá chi tiết các phòng.

### Bồi thường vật dụng
- **Tab riêng biệt**: Chuyển đổi giữa "Tính tiền phòng" và "Bồi thường vật dụng".
- **Danh sách vật dụng**: Lấy từ bảng `items` trong Lark Base, hiển thị dạng lưới đa cột.
- **Gom nhóm theo loại**: Phân nhóm theo `kind` (cái, đôi, ...).
- **Chọn số lượng**: Bộ điều khiển +/- cho phép chọn số lượng bồi thường (tối đa theo số lượng trong phòng).
- **Tìm kiếm**: Ô tìm kiếm lọc nhanh theo tên hoặc loại vật dụng.
- **Tổng tiền**: Tự động tính `unit_price × số lượng đã chọn`.

## Công nghệ

React 19, TypeScript 5.8, Vite 6, Tailwind CSS 4, Lark Open API, Framer Motion, Lucide React, date-fns, react-day-picker.

## Cấu trúc

```
src/
├── App.tsx                     # State & layout chính, tab switcher
├── main.tsx                    # Entry point
├── index.css                   # Tailwind + custom styles
├── types.ts                    # Types gốc
├── components/
│   ├── types.ts                # Types dùng chung (RoomType, CalculationResult, Item...)
│   ├── useHotelCalculator.ts   # Logic tính toán giá
│   ├── ItemCompensation.tsx    # Tab bồi thường vật dụng
│   ├── BranchDropdown.tsx      # Chọn chi nhánh
│   ├── RoomDropdown.tsx        # Chọn loại phòng
│   ├── DateRangePicker.tsx     # Chọn ngày
│   ├── GlobalAdjustmentControl.tsx # Điều chỉnh tổng đơn
│   ├── PriceSummary.tsx        # Tổng tiền & chi tiết
│   ├── ComparisonPanel.tsx     # So sánh lựa chọn
│   ├── EarlyLateOptions.tsx    # Check-in sớm / Check-out trễ
│   ├── SurchargeBanner.tsx     # Banner phụ thu
│   ├── FetchErrorView.tsx      # Trang lỗi
│   ├── MultiRoomSelector.tsx   # Chọn & cấu hình nhiều phòng
│   └── MultiRoomSummary.tsx    # Tổng hợp & sao chép báo giá nhiều phòng
├── lib/
│   ├── hotelCalculator.ts      # Logic tính giá
│   └── utils.ts                # cn() utility
└── server/
    └── lark-api.mjs            # API cục bộ đọc Lark Base
```

## Cài đặt

```bash
npm install
cp .env.example .env          # Điền LARK_APP_ID, LARK_APP_SECRET, LARK_BASE_TOKEN
npm run dev                    # Chạy web và API Lark cục bộ
npm run build                  # Build production
```

## Lark Base

Ứng dụng đọc dữ liệu từ Base **Siris Web**, gồm các bảng `branches`, `room_types`, `stay_discounts`, `date_adjustments` và `items`. Máy chủ Node.js trên máy tính gọi Lark Open API, còn trình duyệt chỉ gọi `/api/hotel-data`; App Secret và access token không được gửi xuống trình duyệt.

Trong Lark Developer Console, tạo ứng dụng nội bộ, cấp quyền đọc bản ghi Base, thêm ứng dụng vào Base Siris Web, rồi điền App ID, App Secret và Base token vào `.env`. Khởi động lại `npm run dev` sau khi đổi `.env`.

## Triển khai trên Vercel

Project Vercel sử dụng framework Vite, lệnh build `npm run build` và thư mục đầu ra `dist`. Đường dẫn `/api/hotel-data` được phục vụ bằng Node.js Vercel Function trong `api/hotel-data.js`, dùng chung phần đọc và kiểm tra dữ liệu Lark với máy chủ cục bộ.

Thêm `LARK_APP_ID`, `LARK_APP_SECRET` và `LARK_BASE_TOKEN` vào Environment Variables của project cho môi trường **Production**, rồi triển khai lại. Không dùng tiền tố `VITE_` cho các giá trị này. Các biến chỉ được đọc phía máy chủ; file `.env` cục bộ không được đưa vào Git hay bản triển khai.

Function chạy tại Singapore (`sin1`). Phản hồi thành công được CDN Vercel lưu 5 giây, không trả bản cũ khi cập nhật nền; trình duyệt không lưu dữ liệu API và lỗi không được lưu đệm. Production không lưu thêm bộ dữ liệu trong instance để tránh cộng dồn thời gian đệm; bản cục bộ vẫn lưu trong bộ nhớ 30 giây. Sau khi hết cache, yêu cầu tiếp theo đọc Lark mới; thời gian cập nhật gồm tối đa 5 giây cache cộng thời gian gọi Lark, không phải đồng bộ tức thì.

Tenant access token được tái sử dụng theo hạn Lark trả về. Trên Vercel, token được mã hóa AES-256-GCM bằng khóa dẫn xuất từ App Secret và lưu trong Runtime Cache theo project, môi trường và thông tin xác thực để instance mới không cần xác thực lại. Token được bỏ trước hạn 60 giây; nếu Lark từ chối token, API xác thực lại và thay bản cache. Cache lỗi hoặc quá 500 ms thì tiếp tục xác thực trực tiếp với Lark. Không lưu App Secret trong cache hoặc trả token xuống trình duyệt.

Các yêu cầu đồng thời trong cùng instance dùng chung một lần tải đủ 5 bảng, chỉ đọc các cột ứng dụng cần. Khi cache CDN hết hạn, API đọc dữ liệu mới và trả lỗi nếu không thể tải đủ dữ liệu hợp lệ. Header `Server-Timing` và log `hotel-data-load` chỉ ghi tổng thời gian xử lý, không ghi nội dung dữ liệu hoặc token.

## Các cột Lark Base được sử dụng

```sql
-- branches
branches: name, address (Lark `record_id` là ID dùng trong ứng dụng)

-- room_types
room_types: braches (liên kết đến branches), name, weekdayprice, weekendprice, is_hidden

-- stay_discounts
stay_discounts: name, minnights, discountamount, ispercentage

-- date_adjustments
date_adjustments: date, type, amount, ispercentage, note

-- items (vật dụng bồi thường)
items: item_name, kind, quantity, unit_price
```

## Kiểm tra code

- `npm run typecheck`: kiểm tra kiểu dữ liệu và khai báo không sử dụng.
- `npm test`: kiểm tra công thức tính giá phòng (yêu cầu Node.js 22.6+ hỗ trợ `--experimental-strip-types`).
- `npm run build`: tạo bản production.
