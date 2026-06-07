# Hotel Price Calculator

Phần mềm tính tiền phòng khách sạn — hỗ trợ quản lý giá linh hoạt theo chi nhánh, loại phòng, thời điểm và các chương trình khuyến mãi.

## Tính năng

- **Đa chi nhánh & loại phòng**: Lựa chọn và so sánh giá giữa các cơ sở.
- **Giá linh hoạt**: Giá riêng cho ngày thường (CN-T5) và cuối tuần (T6-T7).
- **Phụ thu/giảm giá theo ngày**: Tự động áp dụng cho ngày lễ, ngày đặc biệt.
- **Giảm giá theo số đêm**: Tự động chọn ưu đãi tốt nhất dựa trên thời gian lưu trú.
- **Điều chỉnh tổng đơn**: Phụ thu/giảm giá toàn bộ hóa đơn (% hoặc số tiền).
- **VAT**: Tùy chọn bao gồm thuế GTGT, có thể điều chỉnh %.
- **Check-in sớm / Check-out trễ**: 4 tùy chọn phí (12:30, 13:00, trước 13:00, trước 18:00).
- **So sánh lựa chọn**: Bảng so sánh giá giữa các phòng/chi nhánh, hiển thị chênh lệch.
- **Ẩn phòng**: Hỗ trợ ẩn phòng qua cột `is_hidden` trong database.
- **Giao diện responsive**: Tối ưu cho cả mobile và desktop.
- **Đặt cọc**: Tự động tính 50% đặt cọc.

## Công nghệ

React 19, TypeScript 5.8, Vite 6, Tailwind CSS 4, Supabase, Framer Motion, Lucide React, date-fns, react-day-picker.

## Cấu trúc

```
src/
├── App.tsx                     # State & layout chính
├── main.tsx                    # Entry point
├── index.css                   # Tailwind + custom styles
├── types.ts                    # Types gốc
├── components/
│   ├── types.ts                # Types dùng chung (RoomType, CalculationResult...)
│   ├── useHotelCalculator.ts   # Logic tính toán giá
│   ├── BranchDropdown.tsx       # Chọn chi nhánh
│   ├── RoomDropdown.tsx         # Chọn loại phòng
│   ├── DateRangePicker.tsx      # Chọn ngày
│   ├── GlobalAdjustmentControl.tsx # Điều chỉnh tổng đơn
│   ├── PriceSummary.tsx         # Tổng tiền & chi tiết
│   ├── ComparisonPanel.tsx      # So sánh lựa chọn
│   ├── EarlyLateOptions.tsx     # Check-in sớm / Check-out trễ
│   ├── SurchargeBanner.tsx      # Banner phụ thu
│   └── FetchErrorView.tsx       # Trang lỗi
└── lib/
    ├── supabase.ts              # Supabase client
    └── utils.ts                 # cn() utility
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
-- Tạo các bảng (branch_id dạng snake_case hoặc camelCase đều được hỗ trợ)
branches: id, name, address
room_types: id, branch_id/branchId, name, weekday_price/weekdayPrice, weekend_price/weekendPrice, is_hidden/isHidden
stay_discounts: id, name, min_nights/minNights, discount_amount/discountAmount, is_percentage/isPercentage
date_adjustments: id, date, type, amount, is_percentage/isPercentage, note