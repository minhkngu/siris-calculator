# Hotel Price Calculator - Phần mềm tính tiền phòng chuyên nghiệp

Hệ thống tính toán giá phòng khách sạn hiện đại, hỗ trợ quản lý giá linh hoạt theo chi nhánh, loại phòng, thời điểm và các chương trình khuyến mãi.

## 🌟 Tính năng nổi bật

- **Quản lý đa chi nhánh**: Dễ dàng lựa chọn và xem thông tin giá phòng theo từng cơ sở.
- **Giá phòng linh hoạt**: Hỗ trợ thiết lập giá khác nhau cho ngày thường (CN-T5) và cuối tuần (T6-T7).
- **Điều chỉnh theo ngày (Surcharges/Discounts)**: Tự động áp dụng phụ thu hoặc giảm giá cho các ngày lễ, ngày đặc biệt.
- **Khuyến mãi theo thời gian lưu trú**: Tự động tính toán giảm giá dựa trên số đêm khách ở.
- **Điều chỉnh tổng đơn**: Cho phép thêm phụ thu hoặc giảm giá trực tiếp trên tổng hóa đơn (theo % hoặc số tiền cố định).
- **Tính toán VAT**: Tùy chọn bao gồm thuế giá trị gia tăng.
- **So sánh giá**: Bảng so sánh trực quan giữa các chi nhánh và loại phòng, tự động đánh dấu phương án rẻ nhất.
- **Giao diện hiện đại**: Thiết kế tối giản, hiệu ứng mượt mà (Framer Motion), hỗ trợ tốt trên mọi thiết bị.

## 🛠 Công nghệ sử dụng

- **Frontend**: React 19, TypeScript 5.8 (strict mode), Vite 6.
- **Styling**: Tailwind CSS 4, Framer Motion.
- **Backend & Database**: Supabase (PostgreSQL).
- **Icons & Utils**: Lucide React, date-fns, react-day-picker.

## 📁 Cấu trúc thư mục

```text
├── src/
│   ├── App.tsx                      # Component chính (đã tách nhỏ)
│   ├── main.tsx                     # Entry point
│   ├── index.css                    # Styles (Tailwind CSS 4)
│   ├── types.ts                     # Định nghĩa dữ liệu gốc
│   ├── vite-env.d.ts                # Khai báo type cho Vite
│   ├── components/
│   │   ├── types.ts                 # Định nghĩa type dùng chung
│   │   ├── useHotelCalculator.ts    # Logic tính toán giá (hook)
│   │   ├── BranchDropdown.tsx       # Dropdown chọn chi nhánh
│   │   ├── RoomDropdown.tsx         # Dropdown chọn loại phòng
│   │   ├── DateRangePicker.tsx      # Chọn ngày nhận/trả phòng
│   │   ├── GlobalAdjustmentControl.tsx # Điều chỉnh tổng đơn
│   │   ├── PriceSummary.tsx         # Tổng tiền & chi tiết
│   │   ├── ComparisonPanel.tsx      # So sánh các lựa chọn
│   │   ├── SurchargeBanner.tsx      # Banner thông báo phụ thu
│   │   └── FetchErrorView.tsx       # Hiển thị lỗi
│   └── lib/
│       ├── supabase.ts              # Cấu hình Supabase client
│       └── utils.ts                 # Utility (clsx + tailwind-merge)
├── .env.example                     # Mẫu cấu hình biến môi trường
├── package.json
├── tsconfig.json                    # Strict mode enabled
└── vite.config.ts
```

## 🚀 Hướng dẫn cài đặt

### 1. Cài đặt thư viện
```bash
npm install
```

### 2. Cấu hình biến môi trường (.env)
Tạo file `.env` từ mẫu `.env.example` và điền thông tin từ dự án Supabase của bạn:
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Chạy ứng dụng
```bash
npm run dev
```

### 4. Build production
```bash
npm run build
```
