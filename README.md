# Hotel Price Calculator - Phần mềm tính tiền phòng chuyên nghiệp

Hệ thống tính toán giá phòng khách sạn hiện đại, hỗ trợ quản lý giá linh hoạt theo chi nhánh, loại phòng, thời điểm và các chương trình khuyến mãi.

![Banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## 🌟 Tính năng nổi bật

- **Quản lý đa chi nhánh**: Dễ dàng lựa chọn và xem thông tin giá phòng theo từng cơ sở.
- **Giá phòng linh hoạt**: Hỗ trợ thiết lập giá khác nhau cho ngày thường (CN-T5) và cuối tuần (T6-T7).
- **Điều chỉnh theo ngày (Surcharges/Discounts)**: Tự động áp dụng phụ thu hoặc giảm giá cho các ngày lễ, ngày đặc biệt.
- **Khuyến mãi theo thời gian lưu trú**: Tự động tính toán giảm giá dựa trên số đêm khách ở (ví dụ: ở trên 3 đêm giảm 5%).
- **Điều chỉnh tổng đơn**: Cho phép thêm phụ thu hoặc giảm giá trực tiếp trên tổng hóa đơn (theo % hoặc số tiền cố định).
- **Tính toán VAT**: Tùy chọn bao gồm thuế giá trị gia tăng với mức thuế suất linh hoạt.
- **Giao diện hiện đại**: Thiết kế tối giản, hiệu ứng mượt mà, hỗ trợ tốt trên mọi thiết bị.
- **So sánh giá**: Tính năng so sánh giá giữa các loại phòng và chi nhánh khác nhau.

## 🛠 Công nghệ sử dụng

### Frontend
- **React 19**: Thư viện UI hiện đại nhất.
- **TypeScript**: Đảm bảo tính nhất quán và giảm thiểu lỗi code.
- **Vite**: Công cụ build siêu nhanh.
- **Tailwind CSS 4**: Framework CSS tối ưu cho giao diện đẹp và tùy biến cao.
- **Framer Motion**: Tạo các hiệu ứng chuyển động mượt mà.
- **Lucide React**: Bộ icon vector sắc nét.
- **date-fns**: Xử lý thời gian chính xác.

### Backend & Database
- **Supabase**: Backend-as-a-Service cung cấp cơ sở dữ liệu PostgreSQL.

## 📁 Cấu trúc thư mục

```text
├── src/
│   ├── App.tsx            # Luồng chính và giao diện ứng dụng
│   ├── components/        # Các thành phần giao diện dùng chung
│   ├── lib/               # Cấu hình Supabase và tiện ích
│   ├── types.ts           # Định nghĩa các kiểu dữ liệu
│   └── main.tsx           # File khởi tạo React
├── package.json           # Quản lý dependencies và scripts
└── index.html             # Entry point của ứng dụng
```

## 🚀 Hướng dẫn cài đặt

### Yêu cầu hệ thống
- **Node.js** (Khuyên dùng phiên bản LTS mới nhất)

### Các bước thực hiện

1. **Clone project và cài đặt thư viện:**
   ```bash
   npm install
   ```

2. **Cấu hình môi trường:**
   Tạo file `.env` từ `.env.example` và điền các thông tin từ Supabase:
   - `VITE_SUPABASE_URL`: Project URL của bạn.
   - `VITE_SUPABASE_ANON_KEY`: Anon Key của bạn.

3. **Chạy ứng dụng:**
   ```bash
   npm run dev
   ```

## ⚙️ Cấu hình biến môi trường (.env)

| Biến | Mô tả |
|------|-------|
| `VITE_SUPABASE_URL` | URL kết nối tới dự án Supabase |
| `VITE_SUPABASE_ANON_KEY` | API Key (Anon) để truy cập dữ liệu |

---
Phát triển bởi đội ngũ đam mê công nghệ. Trải nghiệm ngay để tối ưu quy trình kinh doanh của bạn!
