# Hotel Price Calculator - Phần mềm tính tiền phòng chuyên nghiệp

Hệ thống tính toán giá phòng khách sạn hiện đại, hỗ trợ quản lý giá linh hoạt theo chi nhánh, loại phòng, thời điểm và các chương trình khuyến mãi.

![Banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## 🌟 Tính năng nổi bật

- **Quản lý đa chi nhánh**: Dễ dàng lựa chọn và xem thông tin giá phòng theo từng cơ sở.
- **Giá phòng linh hoạt**: Hỗ trợ thiết lập giá khác nhau cho ngày thường (CN-T5) và cuối tuần (T6-T7).
- **Điều chỉnh theo ngày (Surcharges/Discounts)**: Tự động áp dụng phụ thu hoặc giảm giá cho các ngày lễ, ngày đặc biệt.
- **Khuyến mãi theo thời gian lưu trú**: Tự động tính toán giảm giá dựa trên số đêm khách ở.
- **Điều chỉnh tổng đơn**: Cho phép thêm phụ thu hoặc giảm giá trực tiếp trên tổng hóa đơn (theo % hoặc số tiền cố định).
- **Tính toán VAT**: Tùy chọn bao gồm thuế giá trị gia tăng.
- **Giao diện hiện đại**: Thiết kế tối giản, hiệu ứng mượt mà, hỗ trợ tốt trên mọi thiết bị.

## 🛠 Công nghệ sử dụng

- **Frontend**: React 19, TypeScript, Vite.
- **Styling**: Tailwind CSS 4, Framer Motion.
- **Backend & Database**: Supabase (PostgreSQL).
- **Icons & Utils**: Lucide React, date-fns.

## 📁 Cấu trúc thư mục (Siêu gọn)

```text
├── src/
│   ├── App.tsx            # Luồng chính và giao diện ứng dụng
│   ├── components/        # Các thành phần giao diện UI
│   ├── lib/               # Cấu hình Supabase & Utilities
│   ├── types.ts           # Định nghĩa dữ liệu (TypeScript)
│   └── main.tsx           # Entry point
├── .env.example           # Mẫu cấu hình biến môi trường
├── package.json           # Quản lý thư viện
└── index.html             # Trang chính
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

## ☁️ Triển khai lên Vercel

Dự án được tối ưu để chạy hoàn hảo trên Vercel mà không cần server trung gian. 

**Lưu ý quan trọng:** Khi cấu hình **Environment Variables** trên Vercel, bạn bắt buộc phải sử dụng tiền tố `VITE_`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---
Phát triển bởi đội ngũ đam mê công nghệ. Trải nghiệm ngay để tối ưu quy trình kinh doanh của bạn!
