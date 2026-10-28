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
- **Danh sách vật dụng**: Lấy từ bảng `items` trong Supabase, hiển thị dạng lưới đa cột.
- **Gom nhóm theo loại**: Phân nhóm theo `kind` (cái, đôi, ...).
- **Chọn số lượng**: Bộ điều khiển +/- cho phép chọn số lượng bồi thường (tối đa theo số lượng trong phòng).
- **Tìm kiếm**: Ô tìm kiếm lọc nhanh theo tên hoặc loại vật dụng.
- **Tổng tiền**: Tự động tính `unit_price × số lượng đã chọn`.

## Công nghệ

React 19, TypeScript 5.8, Vite 6, Tailwind CSS 4, Supabase, Framer Motion, Lucide React, date-fns, react-day-picker.

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
│   ├── supabase.ts             # Kết nối Supabase
│   ├── hotelData.ts            # Tải và chuyển đổi dữ liệu
│   └── utils.ts                # cn() utility
```

## Cài đặt

```bash
npm install
cp .env.example .env          # Điền VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY
npm run dev
npm run build
```

## Dữ liệu Supabase

Ứng dụng đọc trực tiếp các bảng `branches`, `room_types`, `stay_discounts`, `date_adjustments` và `items` từ Supabase. Tab phòng và tab vật dụng được tải riêng, chỉ khi cần. Cấu hình khóa công khai (anon hoặc publishable), không dùng khóa service role. Các bảng cần có quyền đọc phù hợp với chính sách RLS của dự án.

Trên Vercel, thêm `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` vào Environment Variables, sau đó build và triển khai lại. Đây là biến được đưa vào mã trình duyệt khi build.

## Kiểm tra code

- `npm run typecheck`: kiểm tra kiểu dữ liệu.
- `npm test`: kiểm tra các chức năng tính giá (yêu cầu Node.js 22.6+).
- `npm run build`: tạo bản production.

Các lựa chọn của người dùng được lưu trong phiên trình duyệt; dữ liệu giá được tải lại từ Supabase.
