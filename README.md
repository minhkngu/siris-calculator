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
- **Check-in sớm / Check-out trễ**: 4 tùy chọn phí (12:30, 13:00, trước 13:00, trước 18:00).
- **So sánh lựa chọn**: Bảng so sánh giá giữa các phòng/chi nhánh, hiển thị chênh lệch.
- **Đặt cọc**: Tự động tính 50% đặt cọc.

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
│   └── FetchErrorView.tsx      # Trang lỗi
└── lib/
    ├── supabase.ts             # Supabase client
    └── utils.ts                # cn() utility
```

## Cài đặt

```bash
npm install
cp .env.example .env          # Điền VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm run dev                    # Dev server
npm run build                  # Build production
```

## Database (Supabase)

```sql
-- branches
branches: id, name, address

-- room_types
room_types: id, branch_id/branchId, name, weekday_price/weekdayPrice, weekend_price/weekendPrice, is_hidden/isHidden

-- stay_discounts
stay_discounts: id, name, min_nights/minNights, discount_amount/discountAmount, is_percentage/isPercentage

-- date_adjustments
date_adjustments: id, date, type, amount, is_percentage/isPercentage, note

-- items (vật dụng bồi thường)
items: id, item_name, kind, quantity, unit_price